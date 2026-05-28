'use server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '')

// ==========================================
// MESIN AUTENTIKASI
// ==========================================
export async function loginPemilik(pin: string) {
  if (pin !== '123456') return { success: false, message: 'PIN BRANKAS SALAH!' }
  const cookieStore = await cookies()
  cookieStore.set('user_session', 'true', { path: '/', maxAge: 86400 * 7, httpOnly: true })
  return { success: true }
}

export async function logoutPemilik() {
  const cookieStore = await cookies()
  cookieStore.delete('user_session')
  return { success: true }
}

// ==========================================
// MESIN RADAR DASHBOARD (PENYEDOT DATA)
// ==========================================
export async function getRadarDashboard() {
  const { data: tx } = await supabase.from('transaksi_harian').select('*, kategori!inner(tipe)')

  // Ambil tagihan cicilan bank yang statusnya belum lunas/kurang bayar
  const { data: cicilanDetail } = await supabase.from('cicilan_detail').select('*, cicilan_master!inner(nama_kreditur, cicilan_wajib_per_bulan)').in('status', ['BELUM BAYAR', 'KURANG']).order('tanggal_jatuh_tempo', { ascending: true })

  const { data: utang } = await supabase.from('utang').select('*').eq('status', 'BELUM LUNAS').order('tanggal_jatuh_tempo', { ascending: true })

  return { 
    tx: tx || [], 
    cicilan: cicilanDetail || [], 
    utang: utang || [] 
  }
}

// ==========================================
// MESIN HARIAN (PEMASUKAN & PENGELUARAN)
// ==========================================
export async function getKategori() {
  const { data } = await supabase.from('kategori').select('*').order('nama_kategori', { ascending: true })
  return { kategori: data || [] }
}

export async function tambahKategori(nama_kategori: string, tipe: string) {
  const { error } = await supabase.from('kategori').insert([{ nama_kategori: nama_kategori.toUpperCase(), tipe }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusKategori(id: string) {
  const { error } = await supabase.from('kategori').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function getTransaksiHarian() {
  const { data } = await supabase.from('transaksi_harian').select('*, kategori(nama_kategori, tipe)').order('waktu_transaksi', { ascending: false })
  return { transaksi: data || [] }
}

export async function tambahTransaksiHarian(nominal: number, catatan: string, kategori_id: string) {
  const { error } = await supabase.from('transaksi_harian').insert([{ nominal, catatan, kategori_id }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusTransaksiHarian(id: string) {
  const { error } = await supabase.from('transaksi_harian').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

// ==========================================
// MESIN CICILAN V2 (MASTER - DETAIL)
// ==========================================
export async function getCicilanMaster() {
  const { data } = await supabase.from('cicilan_master').select(`*, cicilan_detail(status, nominal_dibayar)`).order('tanggal_mulai', { ascending: false })
  return { cicilan: data || [] }
}

export async function tambahCicilanMaster(nama: string, pinjaman: number, tenor: number, cicilan_bln: number, tgl_mulai: string) {
  const { data: master, error } = await supabase.from('cicilan_master').insert([{ nama_kreditur: nama.toUpperCase(), total_pinjaman: pinjaman, tenor_bulan: tenor, cicilan_wajib_per_bulan: cicilan_bln, tanggal_mulai: tgl_mulai }]).select().single()
  if (error) return { success: false, message: error.message }

  const detailRows = []
  let currentDate = new Date(tgl_mulai)
  for (let i = 1; i <= tenor; i++) {
    detailRows.push({
      cicilan_id: master.id,
      bulan_ke: i,
      tanggal_jatuh_tempo: new Date(currentDate).toISOString(),
      nominal_dibayar: 0,
      status: 'BELUM BAYAR'
    })
    currentDate.setMonth(currentDate.getMonth() + 1) // Loncat 1 bulan ke depan
  }
  await supabase.from('cicilan_detail').insert(detailRows)
  return { success: true }
}

export async function hapusCicilanMaster(id: string) {
  const { error } = await supabase.from('cicilan_master').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function editCicilanMaster(id: string, nama: string, pokok: number, cicilan_bln: number) {
  const { error } = await supabase.from('cicilan_master').update({
    nama_kreditur: nama.toUpperCase(),
    total_pinjaman: pokok,
    cicilan_wajib_per_bulan: cicilan_bln
  }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function getCicilanDetail(id: string) {
  const { data: master } = await supabase.from('cicilan_master').select('*').eq('id', id).single()
  const { data: detail } = await supabase.from('cicilan_detail').select('*').eq('cicilan_id', id).order('bulan_ke', { ascending: true })
  return { master, detail: detail || [] }
}

export async function setorCicilan(detail_id: string, nominal: number, wajib: number) {
  let status = 'BELUM BAYAR'
  if (nominal >= wajib) status = 'LUNAS'
  else if (nominal > 0) status = 'KURANG' // OPSI A LO

  const { error } = await supabase.from('cicilan_detail').update({ nominal_dibayar: nominal, tanggal_bayar: new Date().toISOString(), status }).eq('id', detail_id)
  return error ? { success: false, message: error.message } : { success: true }
}

// ==========================================
// MESIN UTANG PIUTANG PRIBADI (TEMAN/KELUARGA)
// ==========================================
export async function tambahUtang(nama_kreditur: string, sisa_utang: number, tanggal_jatuh_tempo: string) {
  const { error } = await supabase.from('utang').insert([{ nama_kreditur: nama_kreditur.toUpperCase(), sisa_utang, tanggal_jatuh_tempo }])
  return error ? { success: false, message: error.message } : { success: true }
}

export async function bayarUtang(id: string, sisa_sekarang: number, nominal_bayar: number) {
  const sisa_baru = sisa_sekarang - nominal_bayar
  const status = sisa_baru <= 0 ? 'LUNAS' : 'BELUM LUNAS'
  const { error } = await supabase.from('utang').update({ sisa_utang: sisa_baru < 0 ? 0 : sisa_baru, status }).eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}

export async function hapusUtang(id: string) {
  const { error } = await supabase.from('utang').delete().eq('id', id)
  return error ? { success: false, message: error.message } : { success: true }
}