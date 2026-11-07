import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Ban, Plus, Search, X } from 'lucide-react';
import Tabel, { type Column, type Meta } from '../../components/tabel';
import Toast from '../../components/toats';
import { getSalesOrders, type SalesOrder } from '../../services/sales';
import { CancelOrderModal, StatusBadge, dateTime, rupiah } from './shared';
import CreateOrderModal from './create-order-modal';

const LIMIT = 10;

const columns: Column<SalesOrder>[] = [
    { key: 'id', header: 'ID', render: (o) => <span className="font-mono text-xs text-gray-500">#{o.id}</span> },
    { key: 'customer', header: 'Nama', render: (o) => <span className="font-medium text-gray-900">{o.customer}</span> },
    { key: 'status', header: 'Status', align: 'center', render: (o) => <StatusBadge status={o.status} /> },
    { key: 'total', header: 'Total', align: 'right', render: (o) => <span className="tabular-nums">{rupiah.format(o.total)}</span> },
    {
        key: 'created_at',
        header: 'Tanggal',
        render: (o) => <span className="tabular-nums text-gray-600">{dateTime.format(new Date(o.created_at))}</span>,
    },
];

type ToastState = { open: boolean; message: string; severity: 'success' | 'error' };

const SalesOrderList = () => {
    const navigate = useNavigate();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [meta, setMeta] = useState<Meta>();
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<SalesOrder | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });
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
            const res = await getSalesOrders({ page, limit: LIMIT, search: keyword || undefined });
            setOrders(res.data ?? []);
            setMeta(res.meta);
        } catch (error) {
            console.error('Error fetching sales orders:', error);
            setToast({ open: true, message: 'Gagal memuat sales order', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData(page, keyword);
    }, [loadData, page, keyword]);

    const showError = useCallback((message: string) => setToast({ open: true, message, severity: 'error' }), []);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Sales Orders</h1>
                    <p className="text-sm text-gray-500">Daftar pesanan penjualan</p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsCreateOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                    <Plus size={16} />
                    Buat Order
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Cari nama customer..."
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
                data={orders}
                meta={meta}
                loading={loading}
                emptyText={keyword ? `Tidak ada order atas nama "${keyword}"` : 'Belum ada sales order'}
                onPageChange={setPage}
                onDetail={(order) => navigate(`/sales-orders/${order.id}`)}
                extraActions={(order) => {
                    const cancelled = order.status === 'CANCELLED';
                    return (
                        <button
                            type="button"
                            onClick={() => setCancelTarget(order)}
                            disabled={cancelled}
                            title={cancelled ? 'Order sudah dibatalkan' : 'Batalkan order'}
                            aria-label="Batalkan order"
                            className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gray-500"
                        >
                            <Ban size={16} />
                        </button>
                    );
                }}
            />

            <CreateOrderModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSuccess={(message) => {
                    setIsCreateOpen(false);
                    setToast({ open: true, message, severity: 'success' });
                    setPage(1);
                    loadData(1, keyword);
                }}
                onError={showError}
            />

            <CancelOrderModal
                order={cancelTarget}
                onClose={() => setCancelTarget(null)}
                onSuccess={(message) => {
                    setCancelTarget(null);
                    setToast({ open: true, message, severity: 'success' });
                    loadData(page, keyword);
                }}
                onError={(message) => {
                    setCancelTarget(null);
                    setToast({ open: true, message, severity: 'error' });
                }}
            />

            <Toast
                open={toast.open}
                message={toast.message}
                severity={toast.severity}
                onClose={() => setToast((t) => ({ ...t, open: false }))}
            />
        </div>
    );
};

export default SalesOrderList;
