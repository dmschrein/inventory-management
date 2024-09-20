/* API service to handle API interactions in a declarative way */

import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export interface Product {
  productId: string;
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface NewProduct {
  name: string;
  price: number;
  rating?: number;
  stockQuantity: number;
}

export interface SalesSummary {
  salesSummaryId: string;
  totalValue: number;
  changePercentage?: number;
  date: string;
}

export interface PurchaseSummary {
  purchaseSummaryId: string;
  totalPurchased: number;
  changePercentage?: number;
  date: string;
}

export interface ExpenseSummary {
  expenseSummarId: string;
  totalExpenses: number;
  date: string;
}

export interface ExpenseByCategorySummary {
  expenseByCategorySummaryId: string;
  category: string;
  amount: string;
  date: string;
}

export interface DashboardMetrics {
  popularProducts: Product[];
  salesSummary: SalesSummary[];
  purchaseSummary: PurchaseSummary[];
  expenseSummary: ExpenseSummary[];
  expenseByCategorySummary: ExpenseByCategorySummary[];
}

export interface User {
  userId: string;
  name: string;
  email: string;
}

export const api = createApi({
  /* Sets up the base URL for the API */
  baseQuery: fetchBaseQuery({ baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL }),
  reducerPath: "api" /* unique path to store the API state in Redux store */,
  /* helps Redux Query manage cache invalidation by tagging resources. When a mutation (e.g., createProduct) occurs, the cache for certain tags can be invalidated*/
  tagTypes: ["DashboardMetrics", "Products", "Users", "Expenses"],

  /* endpoints function where the actual API queries and mutations are defined 
  Queries are used to fetch data from the server. Each query is defined by calling build.query() and specifying:
  Type: The type of data the query will return.
  Parameters: Input for the query (if any).
  Query function: Defines the URL and any additional request parameters (e.g., search strings).

  * getDashBoardMetrics Query:
  * sends GET request to the /dashboard endpoint
  * returns data of type DashboardMetrics
  * providesTags: ["DashboardMetics"] tells Redux Query to cache the response and tag it under "DashboardMetrics". This tag can later be invalidated when related
  * data is updated, like when a product is created or modified.
  */
  endpoints: (build) => ({
    getDashboardMetrics: build.query<DashboardMetrics, void>({
      query: () => "/dashboard",
      providesTags: ["DashboardMetrics"],
    }),
    /*
     * The query sends a GET request to /products and optionally includes a search parameter.
     * The response will be an array of Product[].
     * If a search term is provided, it appends ?search=<search> as a query string to the URL.
     * providesTags: ["Products"] caches the products and tags them under "Products" for potential invalidation later.
     */
    getProducts: build.query<Product[], string | void>({
      query: (search) => ({
        url: "/products",
        params: search ? { search } : {},
      }),
      providesTags: ["Products"],
    }),

    /*
     * Mutations - are used to send data (e.g., POST, PUT, DELETE) to the server. After a mutation, certain tags are invalidated to refresh cached data.
     * This mutation sends a POST request to /products with the newProduct object as the body.
     * The response will return a Product object.
     * invalidatesTags: ["Products"] ensures that after creating a new product, the cached products data is invalidated and refetched.
     */
    createProduct: build.mutation<Product, NewProduct>({
      query: (newProduct) => ({
        url: "/products",
        method: "POST",
        body: newProduct,
      }),
      invalidatesTags: ["Products"],
    }),
    /*
     * This query sends a GET request to /users and expects an array of User[] objects in response.
     */
    getUsers: build.query<User[], void>({
      query: () => "/users",
      providesTags: ["Users"],
    }),
    /*
     * The query sends a GET request to /expenses and expects an array of ExpenseByCategorySummary[]
     */
    getExpensesByCategory: build.query<ExpenseByCategorySummary[], void>({
      query: () => "/expenses",
      providesTags: ["Expenses"],
    }),
  }),
});

/* Export hooks */
export const {
  useGetDashboardMetricsQuery,
  useGetProductsQuery,
  useCreateProductMutation,
  useGetUsersQuery,
  useGetExpensesByCategoryQuery,
} = api;
