export type Affiliate = {
  id: string;
  partner: string;       // brand name as displayed
  label: string;         // short headline shown in module + tools
  copy: string;          // longer brand-voice one-liner for /tools page
  url: string;           // affiliate tracking URL (empty string if pending approval)
  active: boolean;       // master visibility flag
  module: boolean;       // include in <GoingToJapan /> module
  tools: boolean;        // include on /tools page
};

export const affiliates: Affiliate[] = [
  {
    id: 'airalo',
    partner: 'Airalo',
    label: 'eSIM for Japan',
    copy: 'Cheap eSIM, works the second you land. Skip the rental Wi-Fi counter.',
    url: 'https://airalo.pxf.io/c/6060868/1268485/15608',
    active: true,
    module: true,
    tools: true,
  },
  {
    id: 'jrpass-nationwide',
    partner: 'JRPass.com',
    label: 'JR Pass (nationwide)',
    copy: 'Nationwide rail pass. Worth it if you cross multiple regions. Got pricier in 2023 — check the math before you buy.',
    url: 'https://click.jrpass.com/aff_c?offer_id=19&aff_id=1954',
    active: true,
    module: true,
    tools: true,
  },
  {
    id: 'jrpass-regional',
    partner: 'JRPass.com',
    label: 'Regional Passes',
    copy: 'JR East, Kansai, Kyushu, Hokkaido. Usually a better deal than the nationwide pass for trips focused on one area.',
    url: 'https://click.jrpass.com/aff_c?offer_id=20&aff_id=1954',
    active: true,
    module: false,   // editorial-only, not in module
    tools: true,
  },
  {
    id: 'agoda',
    partner: 'Agoda',
    label: 'Hotels in Japan',
    copy: '',         // fill when approved
    url: '',          // fill when approved
    active: false,    // flip to true when URL lands
    module: true,
    tools: true,
  },
];
