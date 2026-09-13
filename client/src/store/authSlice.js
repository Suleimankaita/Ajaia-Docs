import { createSlice } from "@reduxjs/toolkit";

const TOKEN_KEY = "ajaia_token";

const initialState = {
  token: localStorage.getItem(TOKEN_KEY) || null,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived: (state, action) => {
      const { token, user } = action.payload;
      state.token = token;
      state.user = user;
      localStorage.setItem(TOKEN_KEY, token);
    },
    userLoaded: (state, action) => {
      state.user = action.payload;
    },
    loggedOut: (state) => {
      state.token = null;
      state.user = null;
      localStorage.removeItem(TOKEN_KEY);
    },
  },
});

export const { credentialsReceived, userLoaded, loggedOut } = authSlice.actions;
export default authSlice.reducer;
