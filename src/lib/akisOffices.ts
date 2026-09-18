// AKIS Express offices in Cyprus where a customer can collect an "Office to
// Office" order. The main and neighbourhood branches supplied by the owner; AKIS
// has 100+ points in total, so extend this list when the owner asks for more.

export interface AkisOffice {
  id: string
  /** City / region the office is listed under at checkout. */
  city: string
  name: string
  address: string
}

export const AKIS_PHONE = '7777 1777'

export const AKIS_OFFICES: AkisOffice[] = [
  // Nicosia
  { id: 'nic-strovolos-hub', city: 'Nicosia', name: 'Strovolos — Central Distribution Hub', address: 'Voukourestiou 12, Industrial Area, Strovolos' },
  { id: 'nic-central', city: 'Nicosia', name: 'Nicosia Central', address: '10ab Naxou Str., 1070 Nicosia' },
  { id: 'nic-latsia', city: 'Nicosia', name: 'Latsia', address: 'Yiannou Kranidioti Avenue 20 C & D' },
  { id: 'nic-strovolos-athalassas', city: 'Nicosia', name: 'Strovolos (Athalassas)', address: 'Athalassas Avenue 129' },
  { id: 'nic-strovolos-20', city: 'Nicosia', name: 'Strovolos (Strovolou Ave 20)', address: 'Strovolou Avenue 20' },
  { id: 'nic-strovolos-331z', city: 'Nicosia', name: 'Strovolos (Strovolou Ave 331Z)', address: 'Strovolou Avenue 331Z' },
  { id: 'nic-egkomi', city: 'Nicosia', name: 'Egkomi', address: 'Ionos Street 6A' },
  { id: 'nic-agioi-omologites', city: 'Nicosia', name: 'Agioi Omologites', address: 'John Kennedy Avenue 48' },
  { id: 'nic-pallouriotissa', city: 'Nicosia', name: 'Pallouriotissa', address: '16 Avgoustou Street 1' },
  { id: 'nic-agios-dometios', city: 'Nicosia', name: 'Agios Dometios', address: 'Chrysostomou Street 24' },
  { id: 'nic-geri', city: 'Nicosia', name: 'Geri', address: 'Geriou Street 14A' },
  { id: 'nic-tseri', city: 'Nicosia', name: 'Tseri', address: 'Theodosi Pieridi Street 9' },
  { id: 'nic-dali', city: 'Nicosia', name: 'Dali', address: 'Tefkrou Anthia 44-46 & Chalkanoros 31B' },
  { id: 'nic-kokkinotrimithia', city: 'Nicosia', name: 'Kokkinotrimithia', address: 'Grigori Afxentiou 82B' },
  { id: 'nic-nisou', city: 'Nicosia', name: 'Nisou', address: 'Aigaiou Street 3' },
  { id: 'nic-akaki', city: 'Nicosia', name: 'Akaki', address: 'Grigori Afxentiou 47A' },
  // Limassol
  { id: 'lim-main', city: 'Limassol', name: 'Limassol — Main branch (Franklin Roosevelt)', address: 'Fragklinou Rousvelt Avenue 109H' },
  { id: 'lim-agios-athanasios', city: 'Limassol', name: 'Agios Athanasios', address: 'Evelthontos Ioannidi Street 11' },
  { id: 'lim-mesa-geitonia', city: 'Limassol', name: 'Mesa Geitonia', address: 'Arch. Makariou III Avenue 42' },
  { id: 'lim-polemidia', city: 'Limassol', name: 'Polemidia', address: 'Gian Nouzen Street 18' },
  { id: 'lim-germasogeia', city: 'Limassol', name: 'Germasogeia', address: 'Kolonakiou Street 22' },
  { id: 'lim-pissouri', city: 'Limassol', name: 'Pissouri', address: 'Griva Digeni 12' },
  // Larnaca
  { id: 'lca-main', city: 'Larnaca', name: 'Larnaca — Main branch', address: 'Constantinou Palaiologou Street 16' },
  { id: 'lca-centre', city: 'Larnaca', name: 'Larnaca Centre (Chrysopolitissis)', address: 'Chrysopolitissis Street 18' },
  { id: 'lca-aradippou', city: 'Larnaca', name: 'Aradippou', address: 'Iakovou Patatsou 8/1' },
  { id: 'lca-oroklini', city: 'Larnaca', name: 'Voroklini (Oroklini)', address: 'Okeanias Street 20' },
  { id: 'lca-lefkara', city: 'Larnaca', name: 'Lefkara', address: 'Irakli Strouthou 26, Pano Lefkara' },
  // Paphos
  { id: 'pfo-main', city: 'Paphos', name: 'Paphos — Main branch', address: 'Kiniras Street 3' },
  { id: 'pfo-ellados', city: 'Paphos', name: 'Paphos (Ellados Ave)', address: 'Ellados Avenue 17, Kokkonis Court, Shop 14' },
  { id: 'pfo-geroskipou', city: 'Paphos', name: 'Geroskipou', address: 'Makariou III Avenue 45' },
  { id: 'pfo-polis', city: 'Paphos', name: 'Polis Chrysochous', address: 'Arch. Makariou III Avenue 12' },
  // Famagusta
  { id: 'fam-paralimni', city: 'Famagusta', name: 'Paralimni', address: 'Griva Digeni Avenue' },
  { id: 'fam-ayia-napa', city: 'Famagusta', name: 'Ayia Napa', address: 'Nissi Avenue 32' },
  { id: 'fam-sotira', city: 'Famagusta', name: 'Sotira', address: 'Arch. Makariou III Avenue 14' },
]

/** Offices grouped by city, in list order, for the checkout dropdown. */
export function akisOfficesByCity(): Array<{ city: string; offices: AkisOffice[] }> {
  const groups = new Map<string, AkisOffice[]>()
  for (const office of AKIS_OFFICES) {
    groups.set(office.city, [...(groups.get(office.city) ?? []), office])
  }
  return [...groups.entries()].map(([city, offices]) => ({ city, offices }))
}

/** One-line label stored on the order so the owner knows where to send the parcel. */
export function akisOfficeLabel(office: AkisOffice): string {
  return `${office.name} — ${office.address}, ${office.city}`
}
