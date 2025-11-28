import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const envUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = envUrl.endsWith('/api') ? envUrl : `${envUrl.replace(/\/$/, '')}/api`;

export const api = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: API_URL,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Groups', 'Members', 'Tasks', 'Evaluations'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation({
      query: (userData) => ({
        url: '/auth/register',
        method: 'POST',
        body: userData,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/auth/me',
      providesTags: ['User'],
    }),
    
    // Groups
    getGroups: builder.query({
      query: () => '/groups',
      providesTags: ['Groups'],
    }),
    createGroup: builder.mutation({
      query: (data) => ({
        url: '/groups',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Groups'],
    }),
    updateGroup: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/groups/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Groups'],
    }),
    deleteGroup: builder.mutation({
      query: (id) => ({
        url: `/groups/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Groups'],
    }),
    getGroupMembers: builder.query({
      query: (id) => `/groups/${id}/members`,
      providesTags: ['Members'],
    }),
    
    // Members
    getMembers: builder.query({
      query: (params) => ({
        url: '/members',
        params,
      }),
      providesTags: ['Members'],
    }),
    createMember: builder.mutation({
      query: (data) => ({
        url: '/members',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Members', 'Groups'],
    }),
    updateMember: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/members/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Members', 'Groups'],
    }),
    deleteMember: builder.mutation({
      query: (id) => ({
        url: `/members/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Members', 'Groups'],
    }),
    
    // Tasks
    getTasks: builder.query({
      query: () => '/tasks',
      providesTags: ['Tasks'],
    }),
    createTask: builder.mutation({
      query: (data) => ({
        url: '/tasks',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Tasks'],
    }),
    updateTask: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/tasks/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Tasks'],
    }),
    deleteTask: builder.mutation({
      query: (id) => ({
        url: `/tasks/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Tasks'],
    }),
    getUpcomingTasks: builder.query({
      query: () => '/tasks/upcoming',
      providesTags: ['Tasks'],
    }),
    
    // Evaluations
    getEvaluations: builder.query({
      query: (params) => ({
        url: '/evaluations',
        params,
      }),
      providesTags: ['Evaluations'],
    }),
    createEvaluation: builder.mutation({
      query: (data) => ({
        url: '/evaluations',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Evaluations'],
    }),
    updateEvaluation: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/evaluations/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Evaluations'],
    }),
    deleteEvaluation: builder.mutation({
      query: (id) => ({
        url: `/evaluations/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Evaluations'],
    }),
    batchCreateEvaluations: builder.mutation({
      query: (data) => ({
        url: '/evaluations/batch',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Evaluations'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetCurrentUserQuery,
  useGetGroupsQuery,
  useCreateGroupMutation,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useGetGroupMembersQuery,
  useGetMembersQuery,
  useCreateMemberMutation,
  useUpdateMemberMutation,
  useDeleteMemberMutation,
  useGetTasksQuery,
  useCreateTaskMutation,
  useUpdateTaskMutation,
  useDeleteTaskMutation,
  useGetUpcomingTasksQuery,
  useGetEvaluationsQuery,
  useCreateEvaluationMutation,
  useUpdateEvaluationMutation,
  useDeleteEvaluationMutation,
  useBatchCreateEvaluationsMutation,
} = api;
