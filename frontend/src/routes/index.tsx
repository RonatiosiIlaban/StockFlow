import { createBrowserRouter, Navigate } from 'react-router'
import App from '../App'
import ProductList from '../screen/product/list'
import SalesOrderList from '../screen/sales/list'
import ProductEdit from '../screen/product/update'
import CreateProduct from '../screen/product/create'
import ProductDetail from '../screen/product/detail'
import SalesOrderDetail from '../screen/sales/detail'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      { index: true, element: <Navigate to="/products" replace /> },
      { path: 'products', element: <ProductList /> },
      { path: 'sales-orders', element: <SalesOrderList /> },
      { path: 'sales-orders/:id', element: <SalesOrderDetail /> },
      { path: 'products/:id', element: <ProductDetail /> },
      { path: 'products/:id/edit', element: <ProductEdit /> },
      { path: 'products/create', element: <CreateProduct/>}
    ],
  },
])
