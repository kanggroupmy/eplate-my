"use client";
import { VEHICLE_BRANDS, FITMENT_KEY } from '@/lib/order-options';
import { site } from '@/data/site';

type Draft = { owner_name: string; vehicle_registration: string; chassis_vin?: string; vehicle_brand?: string; customers?: { whatsapp_phone: string } };
export function VehicleOrderForm({ order, busy, save, reset }: { order?: Draft; busy: boolean; save: (data: Record<string, unknown>, file?: File) => Promise<void>; reset: () => void }) {
  return <form onSubmit={e => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const file = form.get('voc');
    form.delete('voc');
    void save({ ...Object.fromEntries(form), vehicle_type_confirmed: form.get('vehicle_type_confirmed') === 'on' }, file instanceof File && file.size ? file : undefined);
  }}>
    <label className="field">Vehicle status<select name="vehicle_usage"><option value="on_the_road">On the road vehicle</option></select></label>
    <div className="form-grid">
      <label className="field">Vehicle owner’s name<input name="owner_name" placeholder="Name as per NRIC" defaultValue={order?.owner_name || ''} autoComplete="name" required maxLength={150}/></label>
      <label className="field">Vehicle owner’s mobile number<input name="whatsapp_phone" type="tel" placeholder="60123456789" autoComplete="tel" defaultValue={order?.customers?.whatsapp_phone || ''} required maxLength={20}/></label>
      <label className="field">Vehicle plate number<input name="vehicle_registration" defaultValue={order?.vehicle_registration || ''} required maxLength={20}/></label>
      <label className="field">Vehicle brand<select name="vehicle_brand" defaultValue={order?.vehicle_brand || ''} required><option value="" disabled>Select brand</option>{VEHICLE_BRANDS.map(brand => <option key={brand}>{brand}</option>)}</select></label>
      <label className="field">Chassis / VIN<input name="chassis_vin" defaultValue={order?.chassis_vin || ''} required minLength={5} maxLength={40}/></label>
      <label className="field">Fitment location<select name="workshop_key" defaultValue={FITMENT_KEY}><option value={FITMENT_KEY}>ONE AUTO MOTORING SDN BHD — Permas Jaya</option></select></label>
    </div>
    <p><strong>ONE AUTO MOTORING SDN BHD</strong><br/>{site.workshop.address}, Malaysia</p>
    <label className="field">JPJ Vehicle Ownership Certificate (VOC)<input name="voc" type="file" accept="image/jpeg,image/png,application/pdf" aria-describedby="voc-help"/></label>
    <p id="voc-help">Upload JPG, PNG or PDF, up to 4 MB. You can save a draft and upload your VOC later. Documents are stored privately.</p>
    <label><input name="vehicle_type_confirmed" type="checkbox" required/> I confirm this vehicle is eligible for JPJePlate.</label>
    <p><button className="btn" disabled={busy}>Save draft / upload VOC</button> <button type="button" disabled={busy} onClick={reset}>Start another order</button></p>
  </form>;
}
