import type { Scenario } from '../lib/types'

// Data contoh (mock) berbentuk IR, jadi bisa diganti hasil ekstraksi sungguhan tanpa mengubah UI.

const kredit: Scenario = {
  id: 'kredit',
  title: 'SOP Pengajuan Kredit',
  processName: 'Pengajuan Kredit',
  fileName: 'sop-pengajuan-kredit.docx',
  kind: 'prosa',
  kindLabel: 'Prosa · bank',
  summary: 'Lima kalimat prosa. Contoh tipikal SOP perbankan yang ditulis bebas.',
  segments: [
    { id: 'S1', text: 'Petugas menerima pengajuan kredit.' },
    { id: 'S2', text: 'Petugas memeriksa kelengkapan dokumen.' },
    { id: 'S3', text: 'Jika dokumen tidak lengkap, pengajuan dikembalikan kepada nasabah.' },
    { id: 'S4', text: 'Jika lengkap, analis melakukan penilaian kredit.' },
    { id: 'S5', text: 'Pengajuan yang memenuhi syarat diteruskan untuk persetujuan.' },
  ],
  orgRoles: ['Customer Service Officer', 'Analis Kredit', 'Kepala Cabang', 'Komite Kredit', 'Teller'],
  graph: {
    pools: [{ id: 'p_nasabah', name: 'Nasabah', refs: ['S3'], position: 'top' }],
    lanes: [
      {
        id: 'l_petugas',
        name: 'Petugas',
        role: 'Customer Service Officer',
        score: 0.78,
        reason: 'Menerima dan memeriksa berkas pengajuan adalah tugas front office.',
        refs: ['S1', 'S2'],
      },
      {
        id: 'l_analis',
        name: 'Analis',
        role: 'Analis Kredit',
        score: 0.94,
        reason: '"Analis" + konteks penilaian kredit. Pencocokan nama persis akan gagal ("Analis" ≠ "Analis Kredit").',
        refs: ['S4'],
      },
    ],
    nodes: [
      { id: 'n_start', kind: 'start', label: 'Pengajuan Kredit Masuk', lane: 'l_petugas', col: 0, refs: ['S1'] },
      { id: 'n_terima', kind: 'task', label: 'Terima Pengajuan Kredit', lane: 'l_petugas', col: 1, refs: ['S1'] },
      {
        id: 'n_periksa',
        kind: 'task',
        label: 'Periksa Kelengkapan Dokumen',
        lane: 'l_petugas',
        col: 2,
        refs: ['S2'],
        form: [
          { name: 'dokumen_lengkap', label: 'Dokumen lengkap?', type: 'INPUT_SELECT', required: true, options: ['ya', 'tidak'], refs: ['S3', 'S4'] },
          { name: 'catatan_pemeriksaan', label: 'Catatan pemeriksaan', type: 'INPUT_TEXTAREA', required: false, refs: ['S2'] },
        ],
      },
      { id: 'n_g1', kind: 'xor', label: 'Dokumen Lengkap?', lane: 'l_petugas', col: 3, refs: ['S3', 'S4'] },
      { id: 'n_kembali', kind: 'task', label: 'Kembalikan Pengajuan ke Nasabah', lane: 'l_petugas', col: 4, refs: ['S3'] },
      { id: 'n_q1', kind: 'placeholder', label: 'Lalu apa?', lane: 'l_petugas', col: 5, refs: [], question: 'q1' },
      {
        id: 'n_nilai',
        kind: 'task',
        label: 'Lakukan Penilaian Kredit',
        lane: 'l_analis',
        col: 4,
        refs: ['S4'],
        form: [
          { name: 'memenuhi_syarat', label: 'Memenuhi syarat?', type: 'INPUT_SELECT', required: true, options: ['ya', 'tidak'], refs: ['S5'] },
          { name: 'catatan_penilaian', label: 'Catatan penilaian', type: 'INPUT_TEXTAREA', required: false, refs: ['S4'] },
        ],
      },
      { id: 'n_g2', kind: 'xor', label: 'Memenuhi Syarat?', lane: 'l_analis', col: 5, refs: ['S5'] },
      { id: 'n_teruskan', kind: 'task', label: 'Teruskan untuk Persetujuan', lane: 'l_analis', col: 6, refs: ['S5'] },
      { id: 'n_q3', kind: 'placeholder', label: 'Disetujui siapa?', lane: 'l_analis', col: 7, refs: [], question: 'q3' },
      { id: 'n_q2', kind: 'placeholder', label: 'Jika tidak?', lane: 'l_analis', col: 6, row: 1, refs: [], question: 'q2' },
    ],
    edges: [
      { id: 'e1', from: 'n_start', to: 'n_terima' },
      { id: 'e2', from: 'n_terima', to: 'n_periksa' },
      { id: 'e3', from: 'n_periksa', to: 'n_g1' },
      { id: 'e4', from: 'n_g1', to: 'n_kembali', label: 'Tidak', cond: { field: 'dokumen_lengkap', op: '==', value: 'tidak' }, refs: ['S3'] },
      { id: 'e5', from: 'n_g1', to: 'n_nilai', label: 'Ya', cond: { field: 'dokumen_lengkap', op: '==', value: 'ya' }, refs: ['S4'] },
      { id: 'e6', from: 'n_kembali', to: 'n_q1' },
      { id: 'e7', from: 'n_nilai', to: 'n_g2' },
      { id: 'e8', from: 'n_g2', to: 'n_teruskan', label: 'Ya', cond: { field: 'memenuhi_syarat', op: '==', value: 'ya' }, refs: ['S5'] },
      { id: 'e9', from: 'n_g2', to: 'n_q2', label: 'Tidak', cond: { field: 'memenuhi_syarat', op: '==', value: 'tidak' } },
      { id: 'e10', from: 'n_teruskan', to: 'n_q3' },
    ],
    msgs: [
      { id: 'm1', from: 'p_nasabah', to: 'n_start', label: 'Formulir pengajuan' },
      { id: 'm2', from: 'n_kembali', to: 'p_nasabah', label: 'Pengajuan dikembalikan' },
    ],
  },
  questions: [
    {
      id: 'q1',
      about: 'n_kembali',
      refs: ['S3'],
      text: 'Setelah pengajuan dikembalikan, apakah nasabah dapat mengajukan ulang?',
      why: 'S3 hanya menyebut pengajuan dikembalikan. Kelanjutannya tidak tertulis di SOP.',
      options: [
        {
          id: 'a',
          label: 'Ya, dokumen perbaikan diperiksa ulang',
          hint: 'Menambah event tunggu + loop ke pemeriksaan',
          patch: {
            removeNodes: ['n_q1'],
            removeEdges: ['e6'],
            addNodes: [{ id: 'n_tunggu', kind: 'catch', label: 'Dokumen Perbaikan Diterima', lane: 'l_petugas', col: 5, refs: [], by: 'q1' }],
            addEdges: [
              { id: 'e6a', from: 'n_kembali', to: 'n_tunggu', by: 'q1' },
              { id: 'e6b', from: 'n_tunggu', to: 'n_periksa', label: 'Periksa ulang', route: 'above', by: 'q1' },
            ],
          },
        },
        {
          id: 'b',
          label: 'Tidak, pengajuan ditutup',
          hint: 'Menambah end event "Pengajuan Dikembalikan"',
          patch: {
            removeNodes: ['n_q1'],
            removeEdges: ['e6'],
            addNodes: [{ id: 'n_end_kembali', kind: 'end', label: 'Pengajuan Dikembalikan', lane: 'l_petugas', col: 5, refs: [], by: 'q1' }],
            addEdges: [{ id: 'e6c', from: 'n_kembali', to: 'n_end_kembali', by: 'q1' }],
          },
        },
      ],
    },
    {
      id: 'q2',
      about: 'n_g2',
      refs: ['S5'],
      text: 'Apa yang terjadi jika pengajuan tidak memenuhi syarat?',
      why: 'S5 hanya mengatur pengajuan yang memenuhi syarat. Cabang "tidak memenuhi syarat" tidak dijelaskan.',
      options: [
        {
          id: 'a',
          label: 'Ditolak, nasabah diberi tahu',
          hint: 'Menambah task pemberitahuan + end "Pengajuan Ditolak"',
          patch: {
            removeNodes: ['n_q2'],
            removeEdges: ['e9'],
            addNodes: [
              { id: 'n_tolak', kind: 'task', label: 'Kirim Pemberitahuan Penolakan', lane: 'l_analis', col: 6, row: 1, refs: [], by: 'q2' },
              { id: 'n_end_tolak', kind: 'end', label: 'Pengajuan Ditolak', lane: 'l_analis', col: 7, row: 1, refs: [], by: 'q2' },
            ],
            addEdges: [
              { id: 'e9a', from: 'n_g2', to: 'n_tolak', label: 'Tidak', cond: { field: 'memenuhi_syarat', op: '==', value: 'tidak' }, by: 'q2' },
              { id: 'e9b', from: 'n_tolak', to: 'n_end_tolak', by: 'q2' },
            ],
          },
        },
        {
          id: 'b',
          label: 'Ditinjau ulang oleh analis',
          hint: 'Menambah loop kembali ke penilaian kredit',
          patch: {
            removeNodes: ['n_q2'],
            removeEdges: ['e9'],
            addEdges: [
              { id: 'e9c', from: 'n_g2', to: 'n_nilai', label: 'Tidak', cond: { field: 'memenuhi_syarat', op: '==', value: 'tidak' }, route: 'below', by: 'q2' },
            ],
          },
        },
      ],
    },
    {
      id: 'q3',
      about: 'n_teruskan',
      refs: ['S5'],
      text: 'Siapa yang memberikan persetujuan kredit?',
      why: 'S5 menyebut "diteruskan untuk persetujuan" tanpa menyebut penyetuju. AlurKerja butuh jabatan ini untuk penugasan task.',
      options: [
        {
          id: 'a',
          label: 'Kepala Cabang',
          hint: 'Lane baru "Kepala Cabang"',
          patch: {
            removeNodes: ['n_q3'],
            removeEdges: ['e10'],
            addLanes: [{ id: 'l_approver', name: 'Kepala Cabang', role: 'Kepala Cabang', score: 1, reason: 'Ditetapkan analis lewat jawaban P3.', refs: [], by: 'q3' }],
            addNodes: [
              { id: 'n_setujui', kind: 'task', label: 'Beri Persetujuan Kredit', lane: 'l_approver', col: 7, refs: [], by: 'q3' },
              { id: 'n_end_ok', kind: 'end', label: 'Pengajuan Disetujui', lane: 'l_approver', col: 8, refs: [], by: 'q3' },
            ],
            addEdges: [
              { id: 'e10a', from: 'n_teruskan', to: 'n_setujui', by: 'q3' },
              { id: 'e10b', from: 'n_setujui', to: 'n_end_ok', by: 'q3' },
            ],
          },
        },
        {
          id: 'b',
          label: 'Komite Kredit',
          hint: 'Lane baru "Komite Kredit"',
          patch: {
            removeNodes: ['n_q3'],
            removeEdges: ['e10'],
            addLanes: [{ id: 'l_approver', name: 'Komite Kredit', role: 'Komite Kredit', score: 1, reason: 'Ditetapkan analis lewat jawaban P3.', refs: [], by: 'q3' }],
            addNodes: [
              { id: 'n_setujui', kind: 'task', label: 'Beri Persetujuan Kredit', lane: 'l_approver', col: 7, refs: [], by: 'q3' },
              { id: 'n_end_ok', kind: 'end', label: 'Pengajuan Disetujui', lane: 'l_approver', col: 8, refs: [], by: 'q3' },
            ],
            addEdges: [
              { id: 'e10a', from: 'n_teruskan', to: 'n_setujui', by: 'q3' },
              { id: 'e10b', from: 'n_setujui', to: 'n_end_ok', by: 'q3' },
            ],
          },
        },
      ],
    },
  ],
  log: [
    { stage: 'Membaca dokumen', detail: '5 kalimat dinomori S1–S5' },
    { stage: 'Ekstraksi proses', detail: '2 aktor internal, 1 pihak eksternal, 2 gateway' },
    { stage: 'Validasi struktur', detail: '3 jalur tanpa akhir → dijadikan pertanyaan, bukan ditebak' },
    { stage: 'Pemetaan jabatan', detail: 'Analis → Analis Kredit · Petugas → Customer Service Officer' },
    { stage: 'Kompilasi BPMN', detail: 'BPMN 2.0 + koordinat diagram + namespace AlurKerja' },
  ],
}

const sopAp: Scenario = {
  id: 'sop-ap',
  title: 'SOP AP Penerbitan Surat Keterangan',
  processName: 'Penerbitan Surat Keterangan',
  fileName: 'sop-ap-surat-keterangan.pdf',
  kind: 'sop-ap',
  kindLabel: 'Tabel SOP AP · pemerintah',
  summary: 'Format Permenpan RB 35/2012: kolom Pelaksana, Kelengkapan, Waktu, Output. Contoh fiktif.',
  identity: [
    { label: 'Nomor SOP', value: 'SOP/DPMPTSP/012/2026 (contoh)' },
    { label: 'Dasar hukum', value: 'Permenpan RB No. 35 Tahun 2012' },
    { label: 'Peringatan', value: 'Apabila berkas tidak lengkap, permohonan tidak dapat diproses.' },
  ],
  segments: [
    { id: 'R1', text: 'Menerima berkas permohonan dan memeriksa kelengkapan', actor: 'Petugas Loket', kelengkapan: 'Formulir permohonan, fotokopi KTP', waktu: '15 menit', output: 'Berkas permohonan' },
    { id: 'R2', text: 'Memverifikasi berkas; jika tidak lengkap, berkas dikembalikan kepada pemohon', actor: 'Kasubbag Umum', kelengkapan: 'Berkas permohonan', waktu: '30 menit', output: 'Berkas terverifikasi' },
    { id: 'R3', text: 'Menyusun konsep surat keterangan', actor: 'Petugas Loket', kelengkapan: 'Berkas terverifikasi', waktu: '1 jam', output: 'Konsep surat' },
    { id: 'R4', text: 'Memaraf konsep surat', actor: 'Kasubbag Umum', kelengkapan: 'Konsep surat', waktu: '30 menit', output: 'Konsep terparaf' },
    { id: 'R5', text: 'Menandatangani surat; jika belum sesuai, dikembalikan untuk diperbaiki', actor: 'Kepala Dinas', kelengkapan: 'Konsep terparaf', waktu: '1 hari', output: 'Surat bertanda tangan' },
    { id: 'R6', text: 'Menyerahkan surat keterangan kepada pemohon', actor: 'Petugas Loket', kelengkapan: 'Surat bertanda tangan', waktu: '15 menit', output: 'Surat keterangan' },
  ],
  orgRoles: ['Petugas Pelayanan', 'Kepala Subbagian Umum', 'Kepala Dinas', 'Sekretaris Dinas'],
  graph: {
    pools: [{ id: 'p_pemohon', name: 'Pemohon', refs: ['R1', 'R2', 'R6'], position: 'bottom' }],
    lanes: [
      {
        id: 'l_loket',
        name: 'Petugas Loket',
        role: 'Petugas Pelayanan',
        score: 0.81,
        reason: 'Istilah berbeda, fungsi sama: menerima berkas di loket pelayanan.',
        refs: ['R1', 'R3', 'R6'],
      },
      {
        id: 'l_kasubbag',
        name: 'Kasubbag Umum',
        role: 'Kepala Subbagian Umum',
        score: 0.97,
        reason: '"Kasubbag" adalah singkatan "Kepala Subbagian". Pencocokan nama persis akan gagal.',
        refs: ['R2', 'R4'],
      },
      {
        id: 'l_kadis',
        name: 'Kepala Dinas',
        role: 'Kepala Dinas',
        score: 1,
        reason: 'Nama jabatan sama persis.',
        refs: ['R5'],
      },
    ],
    nodes: [
      { id: 's_start', kind: 'start', label: 'Permohonan Masuk', lane: 'l_loket', col: 0, refs: ['R1'] },
      {
        id: 's_r1',
        kind: 'task',
        label: 'Terima dan Periksa Berkas',
        lane: 'l_loket',
        col: 1,
        refs: ['R1'],
        sla: '15 menit',
        form: [
          { name: 'formulir_permohonan', label: 'Formulir permohonan', type: 'INPUT_FILE_UPLOAD', required: false, refs: ['R1'] },
          { name: 'fotokopi_ktp', label: 'Fotokopi KTP', type: 'INPUT_FILE_UPLOAD', required: false, refs: ['R1'] },
        ],
      },
      {
        id: 's_r2',
        kind: 'task',
        label: 'Verifikasi Berkas Permohonan',
        lane: 'l_kasubbag',
        col: 2,
        refs: ['R2'],
        sla: '30 menit',
        form: [{ name: 'berkas_lengkap', label: 'Berkas lengkap?', type: 'INPUT_SELECT', required: true, options: ['ya', 'tidak'], refs: ['R2'] }],
      },
      { id: 's_g1', kind: 'xor', label: 'Berkas Lengkap?', lane: 'l_kasubbag', col: 3, refs: ['R2'] },
      { id: 's_kembali', kind: 'task', label: 'Kembalikan Berkas ke Pemohon', lane: 'l_kasubbag', col: 4, row: 1, refs: ['R2'] },
      { id: 's_q1', kind: 'placeholder', label: 'Lalu apa?', lane: 'l_kasubbag', col: 5, row: 1, refs: [], question: 'q1' },
      { id: 's_r3', kind: 'task', label: 'Susun Konsep Surat', lane: 'l_loket', col: 4, refs: ['R3'], sla: '1 jam' },
      { id: 's_r4', kind: 'task', label: 'Paraf Konsep Surat', lane: 'l_kasubbag', col: 5, refs: ['R4'], sla: '30 menit' },
      {
        id: 's_r5',
        kind: 'task',
        label: 'Tandatangani Surat',
        lane: 'l_kadis',
        col: 6,
        refs: ['R5'],
        sla: '1 hari',
        form: [{ name: 'surat_sesuai', label: 'Surat sudah sesuai?', type: 'INPUT_SELECT', required: true, options: ['ya', 'tidak'], refs: ['R5'] }],
      },
      { id: 's_g2', kind: 'xor', label: 'Surat Sudah Sesuai?', lane: 'l_kadis', col: 7, refs: ['R5'] },
      { id: 's_r6', kind: 'task', label: 'Serahkan Surat Keterangan', lane: 'l_loket', col: 8, refs: ['R6'], sla: '15 menit' },
      { id: 's_end', kind: 'end', label: 'Surat Diserahkan', lane: 'l_loket', col: 9, refs: ['R6'] },
    ],
    edges: [
      { id: 'f1', from: 's_start', to: 's_r1' },
      { id: 'f2', from: 's_r1', to: 's_r2' },
      { id: 'f3', from: 's_r2', to: 's_g1' },
      { id: 'f4', from: 's_g1', to: 's_r3', label: 'Ya', cond: { field: 'berkas_lengkap', op: '==', value: 'ya' }, refs: ['R2'] },
      { id: 'f5', from: 's_g1', to: 's_kembali', label: 'Tidak', cond: { field: 'berkas_lengkap', op: '==', value: 'tidak' }, refs: ['R2'] },
      { id: 'f6', from: 's_kembali', to: 's_q1' },
      { id: 'f7', from: 's_r3', to: 's_r4' },
      { id: 'f8', from: 's_r4', to: 's_r5' },
      { id: 'f9', from: 's_r5', to: 's_g2' },
      { id: 'f10', from: 's_g2', to: 's_r6', elbow: true, label: 'Ya', cond: { field: 'surat_sesuai', op: '==', value: 'ya' }, refs: ['R5'] },
      { id: 'f11', from: 's_g2', to: 's_r3', label: 'Tidak, perbaiki', cond: { field: 'surat_sesuai', op: '==', value: 'tidak' }, route: 'above', refs: ['R5'] },
      { id: 'f12', from: 's_r6', to: 's_end' },
    ],
    msgs: [
      { id: 'sm1', from: 'p_pemohon', to: 's_start', label: 'Berkas permohonan' },
      { id: 'sm2', from: 's_kembali', to: 'p_pemohon', label: 'Berkas dikembalikan' },
      { id: 'sm3', from: 's_r6', to: 'p_pemohon', label: 'Surat keterangan' },
    ],
  },
  questions: [
    {
      id: 'q1',
      about: 's_kembali',
      refs: ['R2'],
      text: 'Setelah berkas dikembalikan, apakah pemohon dapat melengkapi dan mengajukan kembali?',
      why: 'Baris 2 hanya menyebut berkas dikembalikan. Kelanjutannya tidak tertulis di SOP.',
      options: [
        {
          id: 'a',
          label: 'Ya, berkas diverifikasi ulang',
          hint: 'Menambah event tunggu + loop ke verifikasi',
          patch: {
            removeNodes: ['s_q1'],
            removeEdges: ['f6'],
            addNodes: [{ id: 's_tunggu', kind: 'catch', label: 'Berkas Perbaikan Diterima', lane: 'l_kasubbag', col: 5, row: 1, refs: [], by: 'q1' }],
            addEdges: [
              { id: 'f6a', from: 's_kembali', to: 's_tunggu', by: 'q1' },
              { id: 'f6b', from: 's_tunggu', to: 's_r2', label: 'Verifikasi ulang', route: 'below', by: 'q1' },
            ],
          },
        },
        {
          id: 'b',
          label: 'Tidak, permohonan selesai',
          hint: 'Menambah end event "Permohonan Dikembalikan"',
          patch: {
            removeNodes: ['s_q1'],
            removeEdges: ['f6'],
            addNodes: [{ id: 's_end_kembali', kind: 'end', label: 'Permohonan Dikembalikan', lane: 'l_kasubbag', col: 5, row: 1, refs: [], by: 'q1' }],
            addEdges: [{ id: 'f6c', from: 's_kembali', to: 's_end_kembali', by: 'q1' }],
          },
        },
      ],
    },
    {
      id: 'q2',
      about: 's_r1',
      refs: ['R1'],
      text: 'Kolom Kelengkapan baris 1 menyebut formulir permohonan dan fotokopi KTP. Jadikan keduanya unggahan wajib?',
      why: 'SOP mencantumkan kelengkapan, tapi tidak menyebut apakah wajib. Bagian Peringatan mengisyaratkan wajib.',
      options: [
        {
          id: 'a',
          label: 'Ya, wajib diunggah',
          hint: 'Field form menjadi required',
          patch: {
            setRequired: [
              { node: 's_r1', field: 'formulir_permohonan', required: true },
              { node: 's_r1', field: 'fotokopi_ktp', required: true },
            ],
          },
        },
        {
          id: 'b',
          label: 'Opsional',
          hint: 'Field form tetap opsional',
          patch: {
            setRequired: [
              { node: 's_r1', field: 'formulir_permohonan', required: false },
              { node: 's_r1', field: 'fotokopi_ktp', required: false },
            ],
          },
        },
      ],
    },
  ],
  log: [
    { stage: 'Membaca dokumen', detail: 'Tabel SOP AP: 6 baris dinomori R1–R6, 3 kolom pelaksana' },
    { stage: 'Ekstraksi proses', detail: '3 aktor internal, 1 pihak eksternal, 2 gateway, 1 loop perbaikan' },
    { stage: 'Validasi struktur', detail: '1 jalur tanpa akhir + 1 kelengkapan ambigu → dijadikan pertanyaan' },
    { stage: 'Pemetaan jabatan', detail: 'Kasubbag Umum → Kepala Subbagian Umum · Petugas Loket → Petugas Pelayanan' },
    { stage: 'Kompilasi BPMN', detail: 'Kelengkapan → field form · Waktu → SLA · namespace AlurKerja' },
  ],
}

export const scenarios: Scenario[] = [kredit, sopAp]
