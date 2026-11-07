import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowDownToLine, ArrowLeft, ArrowUpFromLine, Pencil } from 'lucide-react';
import Tabel, { type Column } from '../../components/tabel';
import {
    getProductById,
    getStockMovementsByProductId,
    type Product,
    type StockMovement,
} from '../../services/products';

const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

const valueClass =
    'flex min-h-[38px] w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="space-y-1">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        <div className={valueClass}>{children}</div>
    </div>
);

const historyColumns: Column<StockMovement>[] = [
    {
        key: 'created_at',
        header: 'Tanggal',
        render: (m) => <span className="tabular-nums text-gray-600">{dateTime.format(new Date(m.created_at))}</span>,
    },
    {
        key: 'type',
        header: 'Tipe',
        render: (m) =>
            m.type === 'in' ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
                    <ArrowDownToLine size={12} />
                    Masuk
                </span>
            ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                    <ArrowUpFromLine size={12} />
                    Keluar
                </span>
            ),
    },
    {
        key: 'qty',
        header: 'Jumlah',
        align: 'right',
        render: (m) => (
            <span className={`font-medium tabular-nums ${m.type === 'in' ? 'text-green-700' : 'text-red-700'}`}>
                {m.type === 'in' ? '+' : '−'}
                {m.qty}
            </span>
        ),
    },
    {
        key: 'note',
        header: 'Catatan',
        render: (m) => <span className="text-gray-600">{m.note || '-'}</span>,
    },
];

const ProductDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [product, setProduct] = useState<Product>();
    const [movements, setMovements] = useState<StockMovement[]>([]);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const [productRes, movementList] = await Promise.all([
                getProductById(id),
                getStockMovementsByProductId(id),
            ]);
            setProduct(productRes.data);
            setMovements(movementList);
        } catch (error) {
            console.error('Error fetching product detail:', error);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Detail Produk</h1>
                    <p className="text-sm text-gray-500">{product ? product.sku : 'Memuat...'}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/products')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} />
                        Kembali
                    </button>
                    {product && (
                        <button
                            type="button"
                            onClick={() => navigate(`/products/${product.id}/edit`)}
                            className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-700"
                        >
                            <Pencil size={16} />
                            Edit
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full space-y-4 rounded-lg border border-gray-200 bg-white p-6 px-12">
                <Field label="SKU">
                    <span className="font-mono">{product?.sku ?? '-'}</span>
                </Field>

                <Field label="Nama">{product?.name ?? '-'}</Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Harga">
                        <span className="tabular-nums">{product ? rupiah.format(product.price) : '-'}</span>
                    </Field>
                    <Field label="Stok">
                        <span className={`tabular-nums ${product?.stock === 0 ? 'font-medium text-red-600' : ''}`}>
                            {product?.stock ?? '-'}
                        </span>
                    </Field>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">Status:</span>
                    {product &&
                        (product.is_active ? (
                            <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Aktif</span>
                        ) : (
                            <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Nonaktif</span>
                        ))}
                </div>
            </div>

            <div className="space-y-3 py-10">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Riwayat Stok</h2>
                    <p className="text-sm text-gray-500">Semua pergerakan stok masuk dan keluar, terbaru di atas</p>
                </div>
                <Tabel
                    columns={historyColumns}
                    data={movements}
                    loading={loading}
                    emptyText="Belum ada riwayat stok"
                />
            </div>
        </div>
    );
};

export default ProductDetail;
