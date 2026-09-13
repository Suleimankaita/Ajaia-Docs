import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

/**
 * Single RTK Query API slice for the whole app. Using one slice with tag
 * invalidation (rather than hand-rolled fetch + useState in every
 * component) gives us caching, loading states, and automatic refetching
 * after mutations for free, which keeps the dashboard and editor in sync
 * without manual state plumbing.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("ajaia_token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Documents", "Document", "Shares"],
  endpoints: (builder) => ({
    register: builder.mutation({
      query: (body) => ({ url: "/auth/register", method: "POST", body }),
    }),
    login: builder.mutation({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    getMe: builder.query({
      query: () => "/auth/me",
    }),

    listDocuments: builder.query({
      query: () => "/documents",
      providesTags: ["Documents"],
    }),
    getDocument: builder.query({
      query: (id) => `/documents/${id}`,
      providesTags: (_result, _error, id) => [{ type: "Document", id }],
    }),
    createDocument: builder.mutation({
      query: (body) => ({ url: "/documents", method: "POST", body }),
      invalidatesTags: ["Documents"],
    }),
    updateDocument: builder.mutation({
      query: ({ id, ...body }) => ({ url: `/documents/${id}`, method: "PATCH", body }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Document", id }, "Documents"],
    }),
    renameDocument: builder.mutation({
      query: ({ id, title }) => ({
        url: `/documents/${id}/title`,
        method: "PATCH",
        body: { title },
      }),
      invalidatesTags: (_result, _error, { id }) => [{ type: "Document", id }, "Documents"],
    }),
    deleteDocument: builder.mutation({
      query: (id) => ({ url: `/documents/${id}`, method: "DELETE" }),
      invalidatesTags: ["Documents"],
    }),
    importDocument: builder.mutation({
      query: (formData) => ({
        url: "/documents/import",
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["Documents"],
    }),

    listShares: builder.query({
      query: (documentId) => `/documents/${documentId}/shares`,
      providesTags: ["Shares"],
    }),
    createShare: builder.mutation({
      query: ({ documentId, email, permission }) => ({
        url: `/documents/${documentId}/shares`,
        method: "POST",
        body: { email, permission },
      }),
      invalidatesTags: ["Shares", "Documents"],
    }),
    deleteShare: builder.mutation({
      query: ({ documentId, userId }) => ({
        url: `/documents/${documentId}/shares/${userId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Shares", "Documents"],
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useGetMeQuery,
  useListDocumentsQuery,
  useGetDocumentQuery,
  useCreateDocumentMutation,
  useUpdateDocumentMutation,
  useRenameDocumentMutation,
  useDeleteDocumentMutation,
  useImportDocumentMutation,
  useListSharesQuery,
  useCreateShareMutation,
  useDeleteShareMutation,
} = apiSlice;
