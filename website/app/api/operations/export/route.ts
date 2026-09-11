import { requireOperations, OperationError, operationFailure, orderFilters, orderListQuery } from '@/lib/operations';
import { csvCell } from '@/lib/operations-upload';
export async function GET(request: Request) {
    try {
        const context = await requireOperations();
        if (!['admin', 'operator'].includes(context.role))
            throw new OperationError('Access denied.', 403);
        const url = new URL(request.url);
        url.searchParams.delete('id');
        const rows: string[] = ['Order ID,Plate,Owner,Email,WhatsApp,Status,Created'];
        const { search, status } = orderFilters(url);
        const { query } = await orderListQuery(context, search, status);
        const { data, count, error } = await query.limit(1000);
        if (error) throw new OperationError('Export unavailable.', 503);
        const total = count || 0;
        for (const o of data || []) rows.push([o.id, o.vehicle_registration, o.owner_name, o.customers?.email, o.customers?.whatsapp_phone, o.status, o.created_at].map(csvCell).join(','));
        await context.admin.from('audit_events').insert({ actor_id: context.user.id, action: 'orders_csv_export', details: { rows: rows.length - 1, truncated: total > 1000 } });
        return new Response('\ufeff' + rows.join('\r\n'), { headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="eplate-orders-first-1000.csv"', 'Cache-Control': 'private, no-store' } });
    }
    catch (error) {
        return operationFailure(error);
    }
}
