import { useCallback, useEffect, useState } from 'react';
import Tabel, { type Column } from '../../components/tabel';
import { getProducts, type Product, type ProductListResponse } from '../../services/products';

const LIMIT = 10;

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const columns: Column<Product>[] = [
    { key: 'sku', header: 'SKU', render: (p) => <span className="font-mono text-xs text-gray-500">{p.sku}</span> },
    { key: 'name', header: 'Nama', render: (p) => <span className="font-medium text-gray-900">{p.name}</span> },
    { key: 'price', header: 'Harga', align: 'right', render: (p) => <span className="tabular-nums">{rupiah.format(p.price)}</span> },
    {
        key: 'stock',
        header: 'Stok',
        align: 'right',
        render: (p) => (
            <span className={`tabular-nums ${p.stock === 0 ? 'font-medium text-red-600' : ''}`}>{p.stock}</span>
        ),
    },
    {
        key: 'is_active',
        header: 'Status',
        align: 'center',
        render: (p) =>
            p.is_active ? (
                <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Aktif</span>
            ) : (
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Nonaktif</span>
            ),
    },
];

const List = () => {
    const [products, setProducts] = useState<ProductListResponse>();
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async (page: number) => {
        setLoading(true);
        try {
            const data = await getProducts({ page, limit: LIMIT });
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(page);
    }, [loadData, page]);

    const handleEdit = (product: Product) => {
        console.log('Edit product:', product.id);
    };

    const handleDelete = (product: Product) => {
        console.log('Delete product:', product.id);
    };

    return (
        <div className="space-y-4">
            <div>
                <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
                <p className="text-sm text-gray-500">Daftar produk dan stok yang tersedia</p>
            </div>

            <Tabel
                columns={columns}
                data={products?.data}
                meta={products?.meta}
                loading={loading}
                emptyText="Belum ada produk"
                onPageChange={setPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />
        </div>
    );
};

export default List;
