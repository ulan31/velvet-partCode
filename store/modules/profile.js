import binanceApi from '../../api/binance';
import usersApi from '../../api/users';

import * as mt from '../../constants/mutationTypes/profile';

const state = {
  actualDate: undefined,
  isLoading: false,
  profile: undefined,
};

const getters = {
  actualDate: state => state.actualDate,
  isLoading: state => state.isLoading,
  data: state => state.profile,
};

const actions = {
  async getProfile({ commit }) {
    commit(mt.GET_PROFILE_REQUEST);
    try {
      const [
        profileInfoResponse,
      ] = await Promise.all([
        usersApi.getProfile(),
      ]);


      const profile = {
        ...profileInfoResponse.data.result,
      };

      if (profile.keyValid) {
        const profileAssetsResponse = await binanceApi.getAssets();
        profile.assets = profileAssetsResponse.data.result;
      }

      commit(mt.GET_PROFILE_SUCCESS, profile);
    } catch (caught) {
      console.error(caught);
      commit(mt.GET_PROFILE_FAILURE);
    }
  },
  async createProfile({ commit }, data) {
    commit(mt.CREATE_PROFILE_REQUEST);
    try {
      const response = await usersApi.createUser(data);
      console.log(response)

      commit(mt.CREATE_PROFILE_SUCCESS, response.data.result, new Date());

      return response.data.result;
    } catch (caught) {
      console.error(caught);
      commit(mt.CREATE_PROFILE_FAILURE);
    }
  },
};

const mutations = {
  [mt.GET_PROFILE_FAILURE](state) {
    state.isLoading = false;
  },
  [mt.GET_PROFILE_REQUEST](state) {
    state.isLoading = true;
  },
  [mt.GET_PROFILE_SUCCESS](state, profile, actualDate) {
    state.actualDate = actualDate;
    state.profile = profile;
    state.isLoading = false;
  },
  [mt.CREATE_PROFILE_FAILURE](state) {
    state.isLoading = false;
  },
  [mt.CREATE_PROFILE_REQUEST](state) {
    state.isLoading = true;
  },
  [mt.CREATE_PROFILE_SUCCESS](state, profile) {
    state.profile = profile;
    state.isLoading = false;
  },
};

export default {
  actions,
  getters,
  mutations,
  namespaced: true,
  state,
};
