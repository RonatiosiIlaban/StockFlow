import { createBrowserRouter, Navigate } from 'react-router'
import App from '../App'
import ProductList from '../screen/product/list'
import SalesOrderList from '../screen/sales/list'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductList /> },
      { path: 'sales-orders', element: <SalesOrderList /> },
    ],
  },
])
