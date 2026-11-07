import { useState } from 'react';
import axios from 'axios';
import Modal from '../../components/modal';
import { cancelSalesOrder, type SalesOrder, type SalesOrderStatus } from '../../services/sales';

export const rupiah = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });
export const dateTime = new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' });

export const StatusBadge = ({ status }: { status: SalesOrderStatus }) =>
    status === 'CREATED' ? (
        <span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Created</span>
    ) : (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">Cancelled</span>
    );

type CancelOrderModalProps = {
    order: SalesOrder | null;
    onClose: () => void;
    onSuccess: (message: string) => void;
    onError: (message: string) => void;
};

/** Konfirmasi cancel sales order. Dipakai di halaman list dan detail. */
export const CancelOrderModal = ({ order, onClose, onSuccess, onError }: CancelOrderModalProps) => {
    const [submitting, setSubmitting] = useState(false);

    const handleConfirm = async () => {
        if (!order) return;
        setSubmitting(true);
        try {
            await cancelSalesOrder(order.id);
            onSuccess(`Sales order #${order.id} berhasil dibatalkan, stok sudah dikembalikan`);
        } catch (error) {
            const message = axios.isAxiosError(error)
                ? error.response?.data?.message ?? 'Gagal membatalkan sales order'
                : 'Gagal membatalkan sales order';
            onError(message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal isOpen={order !== null} onClose={() => !submitting && onClose()}>
            <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900">Batalkan Sales Order</h3>
                <p className="mt-2 text-sm text-gray-500">
                    Yakin ingin membatalkan order <span className="font-medium text-gray-900">#{order?.id}</span> atas nama{' '}
                    <span className="font-medium text-gray-900">{order?.customer}</span>? Stok semua item akan dikembalikan.
                </p>
                <div className="mt-4 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                    >
                        Tidak
                    </button>
                    <button
                        type="button"
                        onClick={handleConfirm}
                        disabled={submitting}
                        className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {submitting ? 'Membatalkan...' : 'Ya, batalkan'}
                    </button>
                </div>
            </div>
        </Modal>
    );
};
