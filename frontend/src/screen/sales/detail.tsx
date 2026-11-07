import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, Ban } from 'lucide-react';
import Tabel, { type Column } from '../../components/tabel';
import Toast from '../../components/toats';
import { getSalesOrderById, type SalesOrder, type SalesOrderItem } from '../../services/sales';
import { CancelOrderModal, StatusBadge, dateTime, rupiah } from './shared';

const valueClass =
    'flex min-h-[38px] w-full items-center rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900';

const Field = ({ label, children }: { label: string; children: ReactNode }) => (
    <div className="space-y-1">
        <span className="block text-sm font-medium text-gray-700">{label}</span>
        <div className={valueClass}>{children}</div>
    </div>
);

const itemColumns: Column<SalesOrderItem>[] = [
    { key: 'sku', header: 'SKU', render: (i) => <span className="font-mono text-xs text-gray-500">{i.sku}</span> },
    { key: 'qty', header: 'Qty', align: 'right', render: (i) => <span className="tabular-nums">{i.qty}</span> },
    {
        key: 'unit_price',
        header: 'Harga Satuan',
        align: 'right',
        render: (i) => <span className="tabular-nums">{rupiah.format(i.unit_price)}</span>,
    },
    {
        key: 'subtotal',
        header: 'Subtotal',
        align: 'right',
        render: (i) => <span className="font-medium tabular-nums text-gray-900">{rupiah.format(i.subtotal)}</span>,
    },
];

type ToastState = { open: boolean; message: string; severity: 'success' | 'error' };

const SalesOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<SalesOrder>();
    const [loading, setLoading] = useState(false);
    const [cancelTarget, setCancelTarget] = useState<SalesOrder | null>(null);
    const [toast, setToast] = useState<ToastState>({ open: false, message: '', severity: 'success' });

    const loadData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getSalesOrderById(id);
            setOrder(res.data);
        } catch (error) {
            console.error('Error fetching sales order:', error);
            setToast({ open: true, message: 'Gagal memuat sales order', severity: 'error' });
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const cancelled = order?.status === 'CANCELLED';

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Detail Sales Order</h1>
                    <p className="text-sm text-gray-500">{order ? `#${order.id}` : 'Memuat...'}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => navigate('/sales-orders')}
                        className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        <ArrowLeft size={16} />
                        Kembali
                    </button>
                    {order && (
                        <button
                            type="button"
                            onClick={() => setCancelTarget(order)}
                            disabled={cancelled}
                            title={cancelled ? 'Order sudah dibatalkan' : undefined}
                            className="inline-flex items-center gap-1.5 rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-red-600"
                        >
                            <Ban size={16} />
                            Batalkan
                        </button>
                    )}
                </div>
            </div>

            <div className="w-full space-y-4 rounded-lg border border-gray-200 bg-white p-6 px-12">
                <div className="grid grid-cols-2 gap-4">
                    <Field label="ID Order">
                        <span className="font-mono">#{order?.id ?? '-'}</span>
                    </Field>
                    <Field label="Nama Customer">{order?.customer ?? '-'}</Field>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="Tanggal Order">
                        <span className="tabular-nums">{order ? dateTime.format(new Date(order.created_at)) : '-'}</span>
                    </Field>
                    <Field label="Total">
                        <span className="font-medium tabular-nums">{order ? rupiah.format(order.total) : '-'}</span>
                    </Field>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-700">
                    <span className="font-medium">Status:</span>
                    {order && <StatusBadge status={order.status} />}
                    {order?.cancelled_at && (
                        <span className="text-xs text-gray-500">
                            dibatalkan {dateTime.format(new Date(order.cancelled_at))}
                        </span>
                    )}
                </div>
            </div>

            <div className="space-y-3">
                <div>
                    <h2 className="text-lg font-semibold text-gray-900">Item</h2>
                    <p className="text-sm text-gray-500">{order ? `${order.items.length} item dalam order ini` : ''}</p>
                </div>
                <Tabel columns={itemColumns} data={order?.items} loading={loading} emptyText="Tidak ada item" />
            </div>

            <CancelOrderModal
                order={cancelTarget}
                onClose={() => setCancelTarget(null)}
                onSuccess={(message) => {
                    setCancelTarget(null);
                    setToast({ open: true, message, severity: 'success' });
                    loadData();
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

export default SalesOrderDetail;
