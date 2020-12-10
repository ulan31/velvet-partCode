<template>
  <div id="profile" v-cloak>
    <ProfileLeftMenu v-if="profileData" :profileEmail="profileEmail"/>
    <MobileTopMenu :profileData="profileData"></MobileTopMenu>

    <div class="profile-main">
      <ProfileHeader
        v-if="profileData"
        :graphData="graphData"
        :isSubscribing="isSubscribing"
        :profileData = "profileData"
        :canRebalance = "canRebalance"
        @modalOpened = "isAuthModalOpened = $event"
      ></ProfileHeader>
      <div class="update-page">Last updated: {{new Date(Date.now()).toLocaleString()}}</div>
      <div class="profile-main-context">
        <ProfileSpinner style="height: 100vh" v-if="profileIsLoading || isGeneratePortfolio"></ProfileSpinner>
        <template v-else>
          <ProfilePriceContainer
            :profileData="profileData"
          ></ProfilePriceContainer>
          <div class="history-portfolio">
            <div class="history">
              <p class="history-text">Performance</p>
              <hr class="history-portfolio-line">
              <ProfileHistoryChart :profileData="profileData" :graphData="graphData"/>
            </div>
            <div class="portfolio">
              <p class="portfolio-text">
                <span class="portfolio-mob">Asset allocation</span>
                <span v-if="profileData.subscriptionStatus
                      && profileData.subscriptionStatus == 'ACTIVE'"
                       class="portfolio-text-top">
                      TOP-30
                </span>
              </p>
              <hr class="history-portfolio-line">
              <div class="mt-3 portfolio-sections">
                <div class="portfolio-section">
                  <ProfileAssetsChart
                    :profileData="profileData"
                    :assetsData="profileData.assets"
                    :isRebalancing="isRebalancing"
                    :graphData="graphData"
                  />
                </div>
                <div v-if="isProfileData" class="mt-4 portfolio-section mob-portfolio-section">
				  <template v-if="isProfileData && true">
                    <b-button class="footer-button" :class="{'disable': isRebalancing || !canRebalance}" :disabled="isRebalancing || !canRebalance"  @click="onGeneratePortfolioClick(false, event)">Generate portfolio</b-button>
                  </template>
                  <template v-else>
                    <b-button class="footer-button" @click="() => openModal()">Generate portfolio</b-button>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <ProfileModal
      v-if="isAuthModalOpened"
      @close="() => isAuthModalOpened = false"
      @isSubscribing="isSubscribing = $event"
      @isGeneratePortfolio="() => this.rebalance()"

    />
    <go-top
      :size="35"
      :right="33"
      bg-color=#212529
    ></go-top>
  </div>
</template>

<script>
  import {mapActions, mapGetters} from 'vuex';
  import Chart from 'chart.js';
  import moment from 'moment';
  import binanceApi from '../api/binance';
  import usersApi from '../api/users';
  import subscriptionsApi from '../api/subscriptions';
  import ProfileLeftMenu from '../components/sidebar/ProfileLeftMenu';
  import MobileTopMenu from '../components/mobile/TopMenu';
  import ProfileAssetsChart from '../components/ProfileAssetsChart';
  import ProfileHistoryChart from '../components/ProfileHistoryChart';
  import ProfileModal from '../components/ProfileModal';
  import ProfilePriceContainer from '../components/ProfilePriceContainer';
  import ProfileSpinner from '../components/ProfileSpinner';
  import ProfileHeader from '../components/ProfileHeader';
  import GoTop from '@inotom/vue-go-top';

  const MIN_USD = 100;
  const RECOMMENDED_USD = 300;

  export default {
    name: 'Profile',
    components: {
      ProfileAssetsChart,
      ProfileHistoryChart,
      ProfileModal,
      ProfilePriceContainer,
      ProfileLeftMenu,
      MobileTopMenu,
      ProfileHeader,
      GoTop,
      ProfileSpinner,
    },
    data() {
      return {
        isRebalancing: false,
        isAuthModalOpened: false,
        isGeneratePortfolio: false,
        isSubscribing: false,
        depositHistory: [],
        withdrawHistory: [],
        btcAmount: 0.00,
      };
    },
    computed: {
      ...mapGetters('profile', {
        profileActualDate: 'actualDate',
        profileData: 'data',
        profileIsLoading: 'isLoading',
      }),
      profileEmail() {
        if (!this.profileData) return;
        return this.profileData.email;
      },
      canRebalance() {
        if (this.profileData && this.profileData.assets) {
          let balance = Object.values(this.profileData.assets)
            .reduce((sum, {usdWorth}) => sum + usdWorth, 0)
            .toFixed(2);
          if (balance < MIN_USD) {
            this.notificationRebalance();
            return false;
          }
          return true
        }
      },
      graphData() {
        if (!this.profileData?.graphData) return {};

        const currentDate = moment(this.profileActualDate).format();
        const currentValue = this.profileData.assets &&
          Object.entries(this.profileData.assets)
            .reduce((sum, [_, {usdWorth}]) => sum + usdWorth, 0);
        return {
          ...this.profileData.graphData,
          [currentDate]: currentValue || undefined,
        };
      },
      isProfileData() {
        if(this.profileData){
          if((Object.entries(this.profileData.assets).length) > 0){
            return true;
          }else{
            return false;
          }
        }
      },
    },
    async created() {
      this.getProfile();
      this.showSwitchedTfa();
      this.notificationInsead();
    },
    destroyed() {
    },
    methods: {
      ...mapActions('profile', {
        getProfile: 'getProfile',
      }),
      showSwitchedTfa(){
        if(this.profileData && !this.profileData.tfa) {
          this.$bvToast.toast('Please enable two-factor authentication in Settings to increase your account security', {
            title: `Enable 2FA`,
            variant: 'info',
            solid: true,
          })
        }
      },
      notificationInsead() {
        if( window.localStorage.getItem('showInsead') ) {
          this.$bvToast.toast('Congratulations, thank you for signing up with your INSEAD email, please enjoy your first 3 months free', {
            title: `Notification`,
            variant: 'success',
            solid: true,
          })
        }
      },
      notificationRebalance() {
        this.$bvToast.toast(`Please deposit more than ${MIN_USD} to use the Automated Portfolio. For the best rebalancing experience we recommend depositing more than ${RECOMMENDED_USD}.`, {
          title: `Insufficient balance`,
          variant: 'danger',
          solid: true,
        })
      },
      onGeneratePortfolioClick(isMobile) {
        gtag('event', 'click', {
          'event_category': 'Generate portfolio',
          'event_label': 'Profile'
        });
        this.rebalance(false);
      },
      async rebalance(toBtc = false) {
        // if (this.isRebalancing) return;
        try {
          this.isGeneratePortfolio = true;
          this.isRebalancing = true;
          let btcAmount = this.btcAmount
          const responce = await usersApi.setBtcAmount({
            btcAmount
          })
          await binanceApi.rebalance(toBtc);
          await this.getProfile();
          this.isGeneratePortfolio = false;
          window.alert('Successfully rebalanced');
          this.isRebalancing = false;
        } catch (caught) {
          this.isRebalancing = false;
          window.alert('Unable to rebalance');
        }
      },
    },
  };
</script>

<style lang="scss" scoped>
  $mobile: "only screen and (max-width: 800px)";

  [v-cloak] {
    display: none;
  }

  #profile{
    display: flex;
    flex-direction: row;
    @media #{$mobile}{
      display: block;
      background-image: linear-gradient(180deg,#406ccd -8%,#6934d4 64%);
    }
  }
  .profile-main {
    margin-left: 260px;
    width: calc(100% - 260px);
    @media #{$mobile} {
      margin-left: 0;
      width: 100%;
    }
  }
  .range {
    text-align: center;
    width: 200px;
    @media #{$mobile} {
      color: #fff;
      width: 230px;
    }
  }
  input[type='range']::-webkit-slider-thumb {
    -webkit-appearance: none;
    background-image: linear-gradient(180deg, #406ccd -8%, #6934d4);

  }

  .profile-main-context {
    padding: 2rem 6rem;
    @media #{$mobile} {
      padding: 2rem;
    }
  }
  .update-page {
    text-align: right;
    margin-top: 2rem;
    margin-right: 2rem;
    font-size: 13px;
    color: #9b9b9b;
    @media #{$mobile} {
      display: none;
    }
  }
  .history-portfolio {
    display: flex;
    justify-content: space-between;
    margin-top: 70px;
    flex-direction: row;
    @media #{$mobile}{
      flex-direction: column;
    }
  }
  .history{
    /*margin-right: 14%;*/
    width: 55%;
    @media #{$mobile} {
      width: 94%;
      margin: 0 auto;
    }
  }
  .portfolio{
    width: 32%;
    @media #{$mobile}{
      width: 94%;
      margin: 0 auto;
    }
  }
  .line-container {
    margin-top: 30px;
  }
  .history-portfolio-line {
    border: none;
    color: #623cd3;
    background-color: #623cd3;
    height: 1px;
    @media #{$mobile}{
      display: none;
    }
  }
  .history-text {
    font-size: 18px;
    color: #623cd3;
    margin: 0;
    @media #{$mobile}{
      display: none;
    }
  }
  .portfolio-mob{
    display: inline-block;
    @media #{$mobile}{
      display: none;
    }
  }
  .portfolio-text {
    font-size: 18px;
    margin: 0;
    color: #623cd3;
    @media #{$mobile}{
      display: block;
      font-size: 18px;
      font-weight: bold;
      color: #fff;
      margin-left: 6%;
      margin-top: 20px;
      margin-bottom: 20px;
    }
  }
  .portfolio-text-top{
    color: #406ccd;
    @media #{$mobile}{
      color: #fff;
    }
  }
  .portfolio-sections {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    /*margin-top: 30px;*/
    @media #{$mobile}{
      align-items: normal;
    }
  }
  .portfolio-section {
    /*margin-top: 40px;*/
  }
  .mob-portfolio-section{
    margin-top: 4%;
    @media #{$mobile}{
      margin-top: 20px;
      margin-left: auto;
      margin-right: auto;
    }
  }
  .button {
    border-radius: 5px;
    background-color: #7849d9;
    border: none;
    padding: 12px 70px;
    font-size: 14px;
    color: #fff;
    font-weight: bold;
    cursor: pointer;
    &:hover {
      box-shadow: 0 0 16px 0 rgba(120, 73, 217, 0.6);
      background-color: #8f59ff;
    }
    @media #{$mobile}{
      font-size: 18px;
      font-weight: bold;
      color: #6834d4;
      background-color: #fff;
      padding: 12px 90px;
      &:hover {
        background-color: #8f59ff;
        box-shadow: 0 0 16px 0 rgba(120, 73, 217, 0.6);
      }
    }
  }
  .left-container-footer {
    display: flex;
    justify-content: center;
    margin-top: 30px;
    @media #{$mobile}{
      margin-top: 40px;
      margin-bottom: 40px;
    }
  }
  .footer-button {
    font-size: 14px;
    font-weight: bold;
    color: #fff;
    padding: 0.6rem 0.75rem;
    border: none;
    opacity: 0.9;
    border-radius: 5px;
    background-image: linear-gradient(99deg, #406ccd, #6934d4 100%);
    cursor: pointer;
    text-transform: uppercase;
    &:hover {
      box-shadow: 0 0 16px 0 #7151d8;
    }
    @media #{$mobile}{
      font-size: 14px;
      font-weight: bold;
      color: #6834d4;
      background-image: none;
      background-color: #fff;
      padding: 12px 25px;

    }
  }
  .disable {
    background-image: none;
    &:hover {
      box-shadow: none;
    }
  }


</style>

