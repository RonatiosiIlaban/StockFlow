import { useCallback, useEffect, useState } from 'react';
import Tabel, { type Column } from '../../components/tabel';
import { deleteProduct, getProducts, type Product, type ProductListResponse } from '../../services/products';
import Modal from '../../components/modal';
import Toast from '../../components/toats';
import axios from 'axios';
import { useNavigate } from 'react-router';
import { PackagePlus, Search, X } from 'lucide-react';
import StockAdjustModal from './stock-adjust-modal';

const LIMIT = 10;

const rupiah = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
});

const buildColumns = (onAdjustStock: (p: Product) => void): Column<Product>[] => [
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
    {
        key: 'id',
        header: 'Atur Stok',
        align: 'center',
        render: (p) => (
            <button
                type="button"
                onClick={() => onAdjustStock(p)}
                title="Atur stok"
                className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50"
            >
                <PackagePlus size={14} />
                Atur
            </button>
        ),
    },
];

const List = () => {
    let navigate = useNavigate();
    const [products, setProducts] = useState<ProductListResponse>();
    const [page, setPage] = useState(1);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(false);
    const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
        open: false,
        message: '',
        severity: 'success',
    });
    const [stockProduct, setStockProduct] = useState<Product | null>(null);
    const [search, setSearch] = useState('');
    const [keyword, setKeyword] = useState('');

    useEffect(() => {
        const timer = setTimeout(() => {
            setKeyword(search.trim());
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const loadData = useCallback(async (page: number, keyword: string) => {
        setLoading(true);
        try {
            const data = await getProducts({ page, limit: LIMIT, search: keyword || undefined });
            setProducts(data);
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(page, keyword);
    }, [loadData, page, keyword]);

    const columns = buildColumns(setStockProduct);

    const handleEdit = (product: Product) => {
        navigate(`/products/${product.id}/edit`);
    };


    const handleConfirmDelete = async () => {
        if (!selectedProduct) return;
        try {
            await deleteProduct(selectedProduct.id);
            setIsDeleteModalOpen(false);
            setToast({ open: true, message: `Produk "${selectedProduct.name}" berhasil dihapus`, severity: 'success' });
            loadData(page, keyword); // refresh tabel
        } catch (error) {
                const message = axios.isAxiosError(error)
                ? error.response?.data?.message ?? 'Gagal menghapus produk'
                : 'Gagal menghapus produk';
                setIsDeleteModalOpen(false);
                setToast({ open: true, message, severity: 'error' });
        }
    };


    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Products</h1>
                    <p className="text-sm text-gray-500">Daftar produk dan stok yang tersedia</p>
                </div>
                <button
                    type="button"
                    className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    onClick={() => navigate('/products/create')}
                >
                    Tambah Produk
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama atau SKU..."
                    className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-9 text-sm focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 [&::-webkit-search-cancel-button]:hidden"
                />
                {search && (
                    <button
                        type="button"
                        onClick={() => setSearch('')}
                        aria-label="Hapus pencarian"
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <Tabel
                columns={columns}
                data={products?.data}
                meta={products?.meta}
                loading={loading}
                emptyText={keyword ? `Tidak ada produk yang cocok dengan "${keyword}"` : 'Belum ada produk'}
                onPageChange={setPage}
                onDetail={(product) => navigate(`/products/${product.id}`)}
                onEdit={handleEdit}
                onDelete={(T) => {
                    setSelectedProduct(T);
                    setIsDeleteModalOpen(true);
                }}
            />

            <StockAdjustModal
                product={stockProduct}
                isOpen={stockProduct !== null}
                onClose={() => setStockProduct(null)}
                onSuccess={(message) => {
                    setStockProduct(null);
                    setToast({ open: true, message, severity: 'success' });
                    loadData(page, keyword);
                }}
                onError={(message) => setToast({ open: true, message, severity: 'error' })}
            />

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
            />
            <Modal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
            >
                <div className="p-6">
                    <h3 className="text-lg font-medium text-gray-900">Konfirmasi Hapus Produk</h3>
                    <p className="mt-2 text-sm text-gray-500">
                        Apakah Anda yakin ingin menghapus produk ini?
                    </p>
                    <div className="mt-4 flex justify-end space-x-3">
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            className="inline-flex items-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                            onClick={handleConfirmDelete}
                        >
                            Hapus
                        </button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

export default List;
