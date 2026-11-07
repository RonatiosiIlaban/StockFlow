import type { ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Eye, Pencil, Trash2 } from 'lucide-react';

export type Column<T> = {
    key: keyof T & string,
    header: string,
    align?: 'left' | 'right' | 'center',
    render?: (row: T) => ReactNode,
};

export type Meta = {
    page: number,
    limit: number,
    total: number,
    total_page?: number,
};

type TabelProps<T extends { id: number }> = {
    columns: Column<T>[],
    data?: T[],
    loading?: boolean,
    emptyText?: string,
    meta?: Meta,
    onPageChange?: (page: number) => void,
    onDetail?: (row: T) => void,
    onEdit?: (row: T) => void,
    onDelete?: (row: T) => void,
};

const alignClass = {
    left: 'text-left',
    right: 'text-right',
    center: 'text-center',
};

const Tabel = <T extends { id: number }>({
    columns,
    data = [],
    loading = false,
    emptyText = 'Belum ada data',
    meta,
    onPageChange,
    onDetail,
    onEdit,
    onDelete,
}: TabelProps<T>) => {
    const hasAction = Boolean(onDetail || onEdit || onDelete);
    const colSpan = columns.length + (hasAction ? 1 : 0);

    const totalPage = meta ? meta.total_page ?? Math.max(1, Math.ceil(meta.total / meta.limit)) : 1;
    const from = meta && meta.total > 0 ? (meta.page - 1) * meta.limit + 1 : 0;
    const to = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

    return (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
                        <tr>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    className={`px-4 py-3 font-medium ${alignClass[col.align ?? 'left']}`}
                                >
                                    {col.header}
                                </th>
                            ))}
                            {hasAction && <th className="w-32 px-4 py-3 text-right font-medium">Aksi</th>}
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-100 text-gray-700">
                        {loading ? (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                                    Memuat data...
                                </td>
                            </tr>
                        ) : data.length === 0 ? (
                            <tr>
                                <td colSpan={colSpan} className="px-4 py-10 text-center text-gray-400">
                                    {emptyText}
                                </td>
                            </tr>
                        ) : (
                            data.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50">
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            className={`whitespace-nowrap px-4 py-3 ${alignClass[col.align ?? 'left']}`}
                                        >
                                            {col.render ? col.render(row) : String(row[col.key] ?? '-')}
                                        </td>
                                    ))}
                                    {hasAction && (
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {onDetail && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDetail(row)}
                                                        title="Detail"
                                                        aria-label="Detail"
                                                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                )}
                                                {onEdit && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onEdit(row)}
                                                        title="Edit"
                                                        aria-label="Edit"
                                                        className="rounded-md p-1.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                )}
                                                {onDelete && (
                                                    <button
                                                        type="button"
                                                        onClick={() => onDelete(row)}
                                                        title="Hapus"
                                                        aria-label="Hapus"
                                                        className="rounded-md p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {meta && (
                <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500">
                    <span>
                        {from}–{to} dari {meta.total}
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => onPageChange?.(meta.page - 1)}
                            disabled={meta.page <= 1 || loading}
                            aria-label="Halaman sebelumnya"
                            className="rounded-md border border-gray-200 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <span className="tabular-nums">
                            {meta.page} / {totalPage}
                        </span>
                        <button
                            type="button"
                            onClick={() => onPageChange?.(meta.page + 1)}
                            disabled={meta.page >= totalPage || loading}
                            aria-label="Halaman berikutnya"
                            className="rounded-md border border-gray-200 p-1.5 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Tabel;
