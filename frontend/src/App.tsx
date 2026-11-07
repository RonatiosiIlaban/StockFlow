import { NavLink, Outlet } from 'react-router'
import { Package, ShoppingCart } from 'lucide-react'

const menu = [
  { to: '/products', label: 'Products', icon: Package },
  { to: '/sales-orders', label: 'Sales Orders', icon: ShoppingCart },
]

function App() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="w-60 border-r bg-white p-4">
        <h1 className="mb-6 text-xl font-bold">StockFlow</h1>
        <nav className="flex flex-col gap-1">
          {menu.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-2 rounded px-3 py-2 text-sm ${
                  isActive ? 'bg-gray-900 text-white' : 'text-gray-700 hover:bg-gray-100'
                }`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6">
        <Outlet />
      </main>
    </div>
  )
}

export default App
