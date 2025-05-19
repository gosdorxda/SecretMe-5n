export type Locale = "id" | "en"

export interface Translation {
  common: {
    popular?: string
    login?: string
    register?: string
    logout?: string
    dashboard?: string
    language?: string
    getStarted?: string
    loading: string
    loadingDescription: string
    save?: string
    saved?: string
    saving?: string
    cancel?: string
    delete?: string
    edit?: string
    update?: string
    confirm?: string
    success?: string
    error?: string
    yes?: string
    no?: string
    or?: string
    and?: string
    back?: string
    next?: string
    close?: string
    showMore?: string
    showLess?: string
    download?: string
    share?: string
    generating?: string
    creatingImage?: string
    failedToCreate?: string
  }
  branding: {
    appName?: string
    tagline: string
    year?: string
  }
  promotions?: {
    premiumCode?: string
  }
  premiumBanner?: {
    exclusiveFeatures?: string
    demoProfile?: string
    checkFeatures?: string
    upgrade?: string
    closeBanner?: string
  }
  loading?: {
    default?: string
    dashboard?: string
    premium?: string
    page?: string
    login?: string
    register?: string
  }
  home?: {
    hero?: {
      userCount?: string
      title?: string
      subtitle?: string
      cta?: string
    }
    testimonials?: {
      title?: string
      subtitle?: string
      testimonial1?: {
        name?: string
        role?: string
        text?: string
      }
      testimonial2?: {
        name?: string
        role?: string
        text?: string
      }
      testimonial3?: {
        name?: string
        role?: string
        text?: string
      }
    }
    stats?: {
      users?: string
      messages?: string
      satisfaction?: string
      premium?: string
    }
    premium?: {
      badge?: string
      title?: string
      subtitle?: string
      price?: string
      discount?: string
      savePercent?: string
      oneTimePayment?: string
      guarantee?: string
      features?: {
        username?: string
        profilePhoto?: string
        socialLinks?: string
        notifications?: string
        statistics?: string
        publicReplies?: string
        customThemes?: string
        deleteMessages?: string
        shareProfile?: string
        noAds?: string
        futureUpdates?: string
      }
    }
  }
  login?: {
    title?: string
    subtitle?: string
    emailLabel?: string
    emailPlaceholder?: string
    passwordLabel?: string
    passwordPlaceholder?: string
    forgotPassword?: string
    loginButton?: string
    processingButton?: string
    googleButton?: string
    googleProcessingButton?: string
    orDivider?: string
    forgotPasswordLink?: string
    noAccount?: string
    registerLink?: string
    loginSuccess?: string
    loginSuccessMessage?: string
    loginError?: string
    invalidCredentials?: string
    rateLimitError?: string
    networkError?: string
    attemptCount?: string
    googleDisabled?: string
    googleDisabledMessage?: string
  }
  register?: {
    title?: string
    subtitle?: string
    nameLabel?: string
    namePlaceholder?: string
    emailLabel?: string
    emailPlaceholder?: string
    passwordLabel?: string
    passwordPlaceholder?: string
    voucherLabel?: string
    voucherPlaceholder?: string
    voucherValid?: string
    voucherInvalid?: string
    voucherOptional?: string
    registerButton?: string
    processingButton?: string
    googleButton?: string
    googleProcessingButton?: string
    orDivider?: string
    haveAccount?: string
    loginLink?: string
    registerSuccess?: string
    registerSuccessMessage?: string
    registerError?: string
    emailExistsError?: string
    emailExistsAuthError?: string
    networkError?: string
    googleDisabled?: string
    googleDisabledMessage?: string
  }
  forgotPassword?: {
    title?: string
    subtitle?: string
    emailLabel?: string
    emailPlaceholder?: string
    submitButton?: string
    processingButton?: string
    backToLogin?: string
    successTitle?: string
    successMessage?: string
    checkSpam?: string
    tryAgainButton?: string
    backToLoginButton?: string
    emailRequired?: string
    emailNotRegistered?: string
    resetEmailSent?: string
    resetEmailSentMessage?: string
    resetEmailError?: string
    resetEmailErrorMessage?: string
    infoMessage?: string
  }
  dashboard?: {
    header?: {
      greeting?: string
      welcome?: string
    }
    tabs?: {
      messages?: string
      profile?: string
      settings?: string
    }
    statistics?: {
      profileViews?: string
      totalMessages?: string
      repliedMessages?: string
      replyRate?: string
      viewsToday?: string
      messagesRecent?: string
    }
    messagesTab?: {
      title?: string
      publicReplies?: {
        title?: string
        active?: string
        inactive?: string
        activeDescription?: string
        inactiveDescription?: string
      }
      search?: string
      filters?: {
        all?: string
        replied?: string
        unreplied?: string
      }
      noResults?: {
        title?: string
        description?: string
      }
      noMessages?: {
        title?: string
        description?: string
        shareButton?: string
      }
      messageActions?: {
        reply?: string
        delete?: string
        share?: string
      }
    }
    profileTab?: {
      title?: string
      preview?: {
        title?: string
        viewPublic?: string
      }
      profilePhoto?: {
        title?: string
        upload?: string
        change?: string
        remove?: string
        dropzone?: string
        sizeLimit?: string
        uploading?: string
      }
      username?: {
        title?: string
        current?: string
        active?: string
        notSet?: string
        placeholder?: string
        save?: string
        requirements?: string
        availability?: {
          checking?: string
          available?: string
          unavailable?: string
          error?: string
        }
      }
      name?: {
        title?: string
        current?: string
        active?: string
        placeholder?: string
        save?: string
      }
      bio?: {
        title?: string
        current?: string
        filled?: string
        empty?: string
        placeholder?: string
        save?: string
        charactersLeft?: string
      }
      socialMedia?: {
        title?: string
        status?: string
        active?: string
        empty?: string
        instagram?: string
        facebook?: string
        linkedin?: string
        tiktok?: string
        placeholders?: {
          instagram?: string
          facebook?: string
          linkedin?: string
          tiktok?: string
        }
        save?: string
      }
      notifications?: {
        telegram?: {
          title?: string
          status?: string
          active?: string
          inactive?: string
          notSet?: string
          connect?: string
          disconnect?: string
          instructions?: string
          connecting?: string
          connectionCode?: string
          waitingConnection?: string
          connectionSuccess?: string
          connectionError?: string
        }
        whatsapp?: {
          title?: string
          status?: string
          active?: string
          inactive?: string
          notSet?: string
          phoneLabel?: string
          phonePlaceholder?: string
          save?: string
          instructions?: string
        }
      }
      premiumFeatures?: {
        title?: string
        subtitle?: string
        upgradeButton?: string
        features?: {
          username?: string
          title?: string
          description?: string
        }
        benefits?: {
          title?: string
          items?: {
            username?: string
            profilePhoto?: string
            socialLinks?: string
            notifications?: string
            statistics?: string
            publicReplies?: string
            customThemes?: string
            deleteMessages?: string
            shareProfile?: string
            noAds?: string
            lifetime?: string
          }
        }
      }
    }
    settingsTab?: {
      title?: string
      accountInfo?: {
        title?: string
        name?: string
        email?: string
        status?: {
          label?: string
          premium?: string
          free?: string
        }
        joined?: string
      }
      logout?: {
        title?: string
        description?: string
        button?: string
        processing?: string
      }
      deleteAccount?: {
        title?: string
        description?: string
        button?: string
        processing?: string
        confirmTitle?: string
        confirmDescription?: string
        confirmButton?: string
        cancelButton?: string
      }
    }
    premiumBanner?: {
      title?: string
      description?: string
      upgradeButton?: string
      alreadyPremium?: string
      features?: string
    }
    profileQuickView?: {
      yourProfile?: string
      copyLink?: string
      viewPublic?: string
      linkCopied?: string
    }
  }
  shareImage?: {
    title?: string
    description?: string
    shareText?: string
    downloadButton?: string
    shareButton?: string
    successDownload?: string
    successShare?: string
    errorTitle?: string
    errorDescription?: string
  }
  premiumPromo?: {
    message: string
  }
}

export const translations: Record<Locale, Translation> = {
  id: {
    common: {
      popular: "Populer",
      login: "Masuk",
      register: "Daftar",
      logout: "Keluar",
      dashboard: "Dashboard",
      language: "Bahasa",
      getStarted: "Mulai Sekarang",
      loading: "Memuat",
      loadingDescription: "Mohon tunggu sebentar...",
      save: "Simpan",
      saved: "Tersimpan",
      saving: "Menyimpan...",
      cancel: "Batal",
      delete: "Hapus",
      edit: "Edit",
      update: "Perbarui",
      confirm: "Konfirmasi",
      success: "Berhasil",
      error: "Error",
      yes: "Ya",
      no: "Tidak",
      or: "ATAU",
      and: "dan",
      back: "Kembali",
      next: "Lanjut",
      close: "Tutup",
      showMore: "Tampilkan lebih",
      showLess: "Tampilkan kurang",
      download: "Unduh",
      share: "Bagikan",
      generating: "Membuat gambar...",
      creatingImage: "Membuat gambar...",
      failedToCreate: "Tidak dapat membuat gambar",
    },
    branding: {
      appName: "SECRETME2025",
      tagline: "Platform pesan rahasia terbaik",
      year: "2025",
    },
    promotions: {
      premiumCode: "Gunakan kode SECRETME2025 untuk mendapatkan akses premium secara gratis!",
    },
    premiumBanner: {
      exclusiveFeatures: "Fitur Eksklusif",
      demoProfile: "Profil Demo",
      checkFeatures: "Cek Fitur",
      upgrade: "Upgrade",
      closeBanner: "Tutup banner",
    },
    loading: {
      default: "Memuat...",
      dashboard: "Memuat dashboard",
      premium: "Memuat halaman premium",
      page: "Memuat halaman",
      login: "Mempersiapkan halaman login",
      register: "Mempersiapkan halaman registrasi",
    },
    home: {
      hero: {
        userCount: "30.000+ pengguna sudah bergabung!",
        title: "Terima Pesan Anonim dari Siapapun",
        subtitle:
          "Platform untuk menerima pesan dan umpan balik secara anonim. Dapatkan kejujuran dari teman dan rekan kerja Anda.",
        cta: "Buat!",
      },
      testimonials: {
        title: "Ulasan Pengguna",
        subtitle: "Lihat apa kata pengguna tentang pengalaman mereka menggunakan Secretme",
        testimonial1: {
          name: "Dian Pratama",
          role: "Influencer",
          text: '"Secretme membantu saya mendapatkan feedback jujur dari followers. Fitur premium worth it dengan notifikasi yang memudahkan respon cepat!"',
        },
        testimonial2: {
          name: "Rini Sulistiani",
          role: "Manajer HR",
          text: '"Kami gunakan Secretme untuk feedback anonim karyawan. Hasilnya luar biasa! Banyak masalah tersembunyi akhirnya terungkap."',
        },
        testimonial3: {
          name: "Fajar Aditya",
          role: "Content Creator",
          text: '"Game changer untuk konten saya! Dapat ide baru dari pesan anonim dan fitur link sosmed sangat membantu cross-promotion."',
        },
      },
      stats: {
        users: "Pengguna Terdaftar",
        messages: "Pesan Terkirim",
        satisfaction: "Kepuasan Pengguna",
        premium: "Pengguna Premium",
      },
      premium: {
        badge: "PENAWARAN SPESIAL",
        title: "Sekali Bayar, Akses Premium Selamanya!",
        subtitle:
          "Dapatkan akses ke semua fitur premium Secretme dengan pembayaran satu kali. Tanpa biaya berlangganan bulanan!",
        price: "Rp 16.500",
        discount: "Rp 49.000",
        savePercent: "Hemat 38%",
        oneTimePayment: "Pembayaran sekali, akses seumur hidup ke semua fitur premium",
        guarantee: "Garansi 30 hari uang kembali. Tanpa risiko!",
        features: {
          username: "Username kustom permanen selamanya",
          profilePhoto: "Foto profil kustom & bio lengkap",
          socialLinks: "Link media sosial (Instagram, Twitter, dll)",
          notifications: "Notifikasi WhatsApp & Telegram tanpa batas",
          statistics: "Statistik lengkap kunjungan & pesan",
          publicReplies: "Manajemen balasan publik",
          customThemes: "Tema profil kustom & kartu pesan",
          deleteMessages: "Hapus pesan yang tidak diinginkan",
          shareProfile: "Berbagi gambar profil dengan QR code",
          noAds: "Tanpa iklan & prioritas dukungan seumur hidup",
          futureUpdates: "Semua update fitur premium di masa depan",
        },
      },
    },
    login: {
      title: "Masuk untuk melanjutkan",
      subtitle: "Lanjutkan perjalanan komunikasi anonim Anda",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Lupa password?",
      loginButton: "Login",
      processingButton: "Memproses...",
      googleButton: "Masuk dengan Google",
      googleProcessingButton: "Memproses...",
      orDivider: "ATAU",
      forgotPasswordLink: "Lupa Password?",
      noAccount: "Belum punya akun?",
      registerLink: "Daftar",
      loginSuccess: "Login berhasil",
      loginSuccessMessage: "Selamat datang kembali!",
      loginError: "Login gagal",
      invalidCredentials: "Email atau password salah",
      rateLimitError: "Terlalu banyak percobaan login. Silakan coba lagi nanti.",
      networkError: "Masalah koneksi internet. Periksa koneksi Anda dan coba lagi.",
      attemptCount: "Percobaan ke-",
      googleDisabled: "Login dengan Google dinonaktifkan",
      googleDisabledMessage:
        "Karena limit API, pendaftaran via Google dimatikan sementara, silahkan daftar secara manual.",
    },
    register: {
      title: "Daftar untuk memulai",
      subtitle: "Buat akun untuk mulai menerima pesan anonim",
      nameLabel: "Nama",
      namePlaceholder: "Nama Lengkap",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      voucherLabel: "Kode Voucher",
      voucherPlaceholder: "Masukkan kode voucher jika ada",
      voucherValid: "Voucher valid! Anda akan mendapatkan akses premium.",
      voucherInvalid: "Voucher tidak valid",
      voucherOptional: "(opsional)",
      registerButton: "Pendaftaran",
      processingButton: "Memproses...",
      googleButton: "Daftar dengan Google",
      googleProcessingButton: "Memproses...",
      orDivider: "ATAU",
      haveAccount: "Sudah punya akun?",
      loginLink: "Masuk",
      registerSuccess: "Pendaftaran berhasil",
      registerSuccessMessage: "Selamat datang di SecretMe!",
      registerError: "Pendaftaran gagal",
      emailExistsError: "Email sudah terdaftar. Silakan gunakan email lain atau login dengan email ini",
      emailExistsAuthError:
        "Email ini sudah terdaftar tetapi mungkin telah dihapus dari sistem autentikasi. Silakan hubungi admin atau gunakan email lain.",
      networkError: "Terjadi kesalahan saat mendaftar",
      googleDisabled: "Pendaftaran dengan Google dinonaktifkan",
      googleDisabledMessage:
        "Karena limit API, pendaftaran via Google dimatikan sementara, silahkan daftar secara manual.",
    },
    forgotPassword: {
      title: "Lupa Password",
      subtitle: "Masukkan email Anda untuk menerima link reset password",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      submitButton: "Kirim Link Reset",
      processingButton: "Mengirim...",
      backToLogin: "Kembali ke halaman login",
      successTitle: "Email Terkirim!",
      successMessage:
        "Kami telah mengirimkan instruksi reset password ke email Anda. Silakan periksa kotak masuk Anda.",
      checkSpam: "Tidak menerima email? Periksa folder spam atau coba lagi dalam beberapa menit.",
      tryAgainButton: "Coba Lagi",
      backToLoginButton: "Kembali ke Login",
      emailRequired: "Email diperlukan",
      emailNotRegistered: "Alamat email yang Anda masukkan tidak terdaftar di sistem kami",
      resetEmailSent: "Email terkirim",
      resetEmailSentMessage: "Silakan periksa email Anda untuk instruksi reset password",
      resetEmailError: "Gagal mengirim email reset",
      resetEmailErrorMessage: "Terjadi kesalahan saat mengirim email reset password",
      infoMessage: "Kami akan mengirimkan link reset password ke alamat email yang terdaftar di sistem kami.",
    },
    dashboard: {
      header: {
        greeting: "Halo",
        welcome: "Selamat datang kembali di dashboard Anda",
      },
      tabs: {
        messages: "Pesan",
        profile: "Profil",
        settings: "Pengaturan",
      },
      statistics: {
        profileViews: "Kunjungan Profil",
        totalMessages: "Total Pesan",
        repliedMessages: "Pesan Dibalas",
        replyRate: "Tingkat Balasan",
        viewsToday: "Kunjungan Hari Ini",
        messagesRecent: "Pesan 7 Hari Terakhir",
      },
      messagesTab: {
        title: "Pesan Anonim",
        publicReplies: {
          title: "Balasan Publik",
          active: "Aktif",
          inactive: "Nonaktif",
          activeDescription: "Pengunjung dapat membalas pesan Anda",
          inactiveDescription: "Hanya Anda yang dapat membalas pesan",
        },
        search: "Cari pesan...",
        filters: {
          all: "Semua",
          replied: "Dibalas",
          unreplied: "Belum Dibalas",
        },
        noResults: {
          title: "Tidak ada hasil",
          description: "Tidak ada pesan yang cocok dengan pencarian",
        },
        noMessages: {
          title: "Belum ada pesan",
          description: "Bagikan link profil Anda untuk mulai menerima pesan anonim dari teman dan pengikut Anda.",
          shareButton: "Bagikan Profil Anda",
        },
        messageActions: {
          reply: "Balas",
          delete: "Hapus",
          share: "Bagikan",
        },
      },
      profileTab: {
        title: "Profil",
        preview: {
          title: "Pratinjau Profil",
          viewPublic: "Lihat Profil Publik",
        },
        profilePhoto: {
          title: "Foto Profil",
          upload: "Unggah Foto",
          change: "Ganti Foto",
          remove: "Hapus Foto",
          dropzone: "Seret dan lepas foto di sini, atau klik untuk memilih",
          sizeLimit: "Ukuran maksimum 2MB",
          uploading: "Mengunggah...",
        },
        username: {
          title: "Username Kustom",
          current: "Username saat ini:",
          active: "Aktif",
          notSet: "Belum diatur",
          placeholder: "username-anda",
          save: "Simpan Username",
          requirements: "Username hanya boleh berisi huruf, angka, dan tanda hubung",
          availability: {
            checking: "Memeriksa ketersediaan...",
            available: "Username tersedia",
            unavailable: "Username sudah digunakan",
            error: "Gagal memeriksa ketersediaan",
          },
        },
        name: {
          title: "Ubah Nama",
          current: "Nama saat ini:",
          active: "Aktif",
          placeholder: "Nama Anda",
          save: "Simpan Nama",
        },
        bio: {
          title: "Bio / Deskripsi Singkat",
          current: "Bio saat ini:",
          filled: "Terisi",
          empty: "Kosong",
          placeholder: "Ceritakan sedikit tentang diri Anda...",
          save: "Simpan Bio",
          charactersLeft: "karakter tersisa",
        },
        socialMedia: {
          title: "Link Sosial Media",
          status: "Status sosial media:",
          active: "Aktif",
          empty: "Kosong",
          instagram: "Instagram",
          facebook: "Facebook",
          linkedin: "LinkedIn",
          tiktok: "TikTok",
          placeholders: {
            instagram: "Username Instagram Anda",
            facebook: "Username Facebook Anda",
            linkedin: "Username LinkedIn Anda",
            tiktok: "Username TikTok Anda",
          },
          save: "Simpan Link Sosial Media",
        },
        notifications: {
          telegram: {
            title: "Notifikasi Telegram",
            status: "Status:",
            active: "Aktif",
            inactive: "Nonaktif",
            notSet: "Belum diatur",
            connect: "Hubungkan Telegram",
            disconnect: "Putuskan Koneksi",
            instructions: "Untuk menerima notifikasi Telegram, hubungkan akun Anda dengan bot Telegram kami:",
            connecting: "Menghubungkan...",
            connectionCode: "Kode Koneksi:",
            waitingConnection: "Menunggu koneksi...",
            connectionSuccess: "Telegram berhasil terhubung!",
            connectionError: "Gagal menghubungkan Telegram",
          },
          whatsapp: {
            title: "Notifikasi WhatsApp",
            status: "Status:",
            active: "Aktif",
            inactive: "Nonaktif",
            notSet: "Belum diatur",
            phoneLabel: "Nomor WhatsApp",
            phonePlaceholder: "Contoh: 628123456789",
            save: "Simpan Nomor",
            instructions: "Masukkan nomor WhatsApp Anda untuk menerima notifikasi pesan baru.",
          },
        },
        premiumFeatures: {
          title: "Fitur Premium",
          subtitle: "Upgrade ke premium untuk mengakses semua fitur profil",
          upgradeButton: "Upgrade Sekarang",
          features: {
            username: {
              title: "Username Kustom",
              description: "Pilih username unik untuk link profil Anda",
            },
            name: {
              title: "Ubah Nama",
              description: "Ubah nama tampilan profil Anda kapan saja",
            },
            profilePhoto: {
              title: "Foto Profil",
              description: "Unggah foto profil Anda sendiri",
            },
            bio: {
              title: "Bio Profil",
              description: "Tambahkan deskripsi singkat tentang diri Anda",
            },
            socialMedia: {
              title: "Link Sosial Media",
              description: "Tambahkan link Instagram, Facebook, LinkedIn, dan TikTok",
            },
            deleteMessages: {
              title: "Hapus Pesan",
              description: "Hapus pesan yang tidak diinginkan",
            },
          },
          benefits: {
            title: "Keuntungan Premium",
            items: {
              username: "Username kustom permanen selamanya",
              profilePhoto: "Foto profil kustom untuk personalisasi halaman Anda",
              socialLinks: "Tambahkan link Instagram, Facebook, LinkedIn, dan TikTok",
              notifications: "Dapatkan notifikasi langsung saat ada pesan baru",
              statistics: "Lihat statistik kunjungan dan pesan profil Anda",
              publicReplies: "Aktifkan balasan publik untuk pesan Anda",
              customThemes: "Personalisasi tampilan profil dan kartu pesan Anda",
              deleteMessages: "Hapus pesan yang tidak diinginkan",
              shareProfile: "Berbagi profil Anda dengan QR code",
              noAds: "Pengalaman tanpa iklan dan prioritas dukungan",
              lifetime: "Bayar sekali, akses premium selamanya",
            },
          },
        },
      },
      settingsTab: {
        title: "Pengaturan Akun",
        accountInfo: {
          title: "Informasi Akun",
          name: "Nama:",
          email: "Email:",
          status: {
            label: "Status:",
            premium: "Premium",
            free: "Gratis",
          },
          joined: "Bergabung:",
        },
        logout: {
          title: "Keluar Akun",
          description: "Keluar dari akun Anda pada perangkat ini. Anda dapat masuk kembali kapan saja.",
          button: "Keluar",
          processing: "Memproses...",
        },
        deleteAccount: {
          title: "Hapus Akun",
          description:
            "Menghapus akun Anda akan menghapus semua data Anda secara permanen. Tindakan ini tidak dapat dibatalkan.",
          button: "Hapus Akun",
          processing: "Memproses...",
          confirmTitle: "Konfirmasi Penghapusan",
          confirmDescription:
            "Apakah Anda yakin ingin menghapus akun Anda? Semua data Anda akan dihapus secara permanen dan tidak dapat dipulihkan.",
          confirmButton: "Ya, Hapus Akun Saya",
          cancelButton: "Batal",
        },
      },
      premiumBanner: {
        title: "Upgrade ke Premium",
        description: "Dapatkan akses ke semua fitur premium dengan pembayaran satu kali.",
        upgradeButton: "Upgrade Sekarang",
        alreadyPremium: "Anda sudah memiliki akun Premium!",
        features: "Lihat Fitur Premium",
      },
      profileQuickView: {
        yourProfile: "Profil Anda",
        copyLink: "Salin Link",
        viewPublic: "Lihat Profil",
        linkCopied: "Link disalin ke clipboard!",
      },
    },
    shareImage: {
      title: "Bagikan Sebagai Gambar",
      description: "Buat dan bagikan gambar pesan Anda dengan mudah",
      shareText: "Aku baru saja menerima pesan anonim dari seseorang 🤔",
      downloadButton: "Unduh",
      shareButton: "Bagikan",
      successDownload: "Gambar pesan berhasil diunduh",
      successShare: "Gambar pesan berhasil dibagikan",
      errorTitle: "Gagal membagikan",
      errorDescription: "Terjadi kesalahan saat membagikan gambar",
    },
    premiumPromo: {
      message: "Gunakan kode untuk mendapatkan akses premium secara gratis!",
    },
  },
  en: {
    common: {
      popular: "Popular",
      login: "Login",
      register: "Register",
      logout: "Logout",
      dashboard: "Dashboard",
      language: "Language",
      getStarted: "Get Started",
      loading: "Loading",
      loadingDescription: "Please wait a moment...",
      save: "Save",
      saved: "Saved",
      saving: "Saving...",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      update: "Update",
      confirm: "Confirm",
      success: "Success",
      error: "Error",
      yes: "Yes",
      no: "No",
      or: "OR",
      and: "and",
      back: "Back",
      next: "Next",
      close: "Close",
      showMore: "Show more",
      showLess: "Show less",
      download: "Download",
      share: "Share",
      generating: "Generating...",
      creatingImage: "Creating image...",
      failedToCreate: "Failed to create image",
    },
    branding: {
      appName: "SECRETME2025",
      tagline: "The best secret messaging platform",
      year: "2025",
    },
    promotions: {
      premiumCode: "Use code SECRETME2025 to get premium access for free!",
    },
    premiumBanner: {
      exclusiveFeatures: "Exclusive Features",
      demoProfile: "Demo Profile",
      checkFeatures: "Check Features",
      upgrade: "Upgrade",
      closeBanner: "Close banner",
    },
    loading: {
      default: "Loading...",
      dashboard: "Loading dashboard",
      premium: "Loading premium page",
      page: "Loading page",
      login: "Preparing login page",
      register: "Preparing registration page",
    },
    home: {
      hero: {
        userCount: "30,000+ users have joined!",
        title: "Receive Anonymous Messages from Anyone",
        subtitle:
          "A platform to receive anonymous messages and feedback. Get honest opinions from your friends and colleagues.",
        cta: "Create!",
      },
      testimonials: {
        title: "User Reviews",
        subtitle: "See what users say about their experience using Secretme",
        testimonial1: {
          name: "Dian Pratama",
          role: "Influencer",
          text: '"Secretme helps me get honest feedback from followers. The premium features are worth it with notifications that make quick responses easy!"',
        },
        testimonial2: {
          name: "Rini Sulistiani",
          role: "HR Manager",
          text: '"We use Secretme for anonymous employee feedback. The results are amazing! Many hidden issues finally came to light."',
        },
        testimonial3: {
          name: "Fajar Aditya",
          role: "Content Creator",
          text: '"Game changer for my content! I get new ideas from anonymous messages and the social media link feature helps with cross-promotion."',
        },
      },
      stats: {
        users: "Registered Users",
        messages: "Messages Sent",
        satisfaction: "User Satisfaction",
        premium: "Premium Users",
      },
      premium: {
        badge: "SPECIAL OFFER",
        title: "Pay Once, Premium Access Forever!",
        subtitle: "Get access to all Secretme premium features with a one-time payment. No monthly subscription fees!",
        price: "Rp 16,500",
        discount: "Rp 49,000",
        savePercent: "Save 38%",
        oneTimePayment: "One-time payment, lifetime access to all premium features",
        guarantee: "30-day money-back guarantee. No risk!",
        features: {
          username: "Permanent custom username forever",
          profilePhoto: "Custom profile photo & complete bio",
          socialLinks: "Social media links (Instagram, Twitter, etc.)",
          notifications: "Unlimited WhatsApp & Telegram notifications",
          statistics: "Complete visit & message statistics",
          publicReplies: "Public reply management",
          customThemes: "Custom profile themes & message cards",
          deleteMessages: "Delete unwanted messages",
          shareProfile: "Share profile image with QR code",
          noAds: "No ads & lifetime priority support",
          futureUpdates: "All future premium feature updates",
        },
      },
    },
    login: {
      title: "Login to continue",
      subtitle: "Continue your anonymous communication journey",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      forgotPassword: "Forgot password?",
      loginButton: "Login",
      processingButton: "Processing...",
      googleButton: "Login with Google",
      googleProcessingButton: "Processing...",
      orDivider: "OR",
      forgotPasswordLink: "Forgot Password?",
      noAccount: "Don't have an account?",
      registerLink: "Register",
      loginSuccess: "Login successful",
      loginSuccessMessage: "Welcome back!",
      loginError: "Login failed",
      invalidCredentials: "Email or password is incorrect",
      rateLimitError: "Too many login attempts. Please try again later.",
      networkError: "Internet connection issue. Check your connection and try again.",
      attemptCount: "Attempt #",
      googleDisabled: "Google login disabled",
      googleDisabledMessage:
        "Due to API limits, Google registration is temporarily disabled, please register manually.",
    },
    register: {
      title: "Register to get started",
      subtitle: "Create an account to start receiving anonymous messages",
      nameLabel: "Name",
      namePlaceholder: "Full Name",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      passwordLabel: "Password",
      passwordPlaceholder: "••••••••",
      voucherLabel: "Voucher Code",
      voucherPlaceholder: "Enter voucher code if you have one",
      voucherValid: "Valid voucher! You will get premium access.",
      voucherInvalid: "Invalid voucher",
      voucherOptional: "(optional)",
      registerButton: "Register",
      processingButton: "Processing...",
      googleButton: "Register with Google",
      googleProcessingButton: "Processing...",
      orDivider: "OR",
      haveAccount: "Already have an account?",
      loginLink: "Login",
      registerSuccess: "Registration successful",
      registerSuccessMessage: "Welcome to SecretMe!",
      registerError: "Registration failed",
      emailExistsError: "Email already registered. Please use another email or login with this one",
      emailExistsAuthError:
        "This email is already registered but may have been removed from the authentication system. Please contact admin or use another email.",
      networkError: "An error occurred during registration",
      googleDisabled: "Google registration disabled",
      googleDisabledMessage:
        "Due to API limits, Google registration is temporarily disabled, please register manually.",
    },
    forgotPassword: {
      title: "Forgot Password",
      subtitle: "Enter your email to receive a password reset link",
      emailLabel: "Email",
      emailPlaceholder: "email@example.com",
      submitButton: "Send Reset Link",
      processingButton: "Sending...",
      backToLogin: "Back to login page",
      successTitle: "Email Sent!",
      successMessage: "We have sent password reset instructions to your email. Please check your inbox.",
      checkSpam: "Didn't receive the email? Check your spam folder or try again in a few minutes.",
      tryAgainButton: "Try Again",
      backToLoginButton: "Back to Login",
      emailRequired: "Email is required",
      emailNotRegistered: "The email address you entered is not registered in our system",
      resetEmailSent: "Email sent",
      resetEmailSentMessage: "Please check your email for password reset instructions",
      resetEmailError: "Failed to send reset email",
      resetEmailErrorMessage: "An error occurred while sending the password reset email",
      infoMessage: "We will send a password reset link to the email address registered in our system.",
    },
    dashboard: {
      header: {
        greeting: "Hello",
        welcome: "Welcome back to your dashboard",
      },
      tabs: {
        messages: "Messages",
        profile: "Profile",
        settings: "Settings",
      },
      statistics: {
        profileViews: "Profile Views",
        totalMessages: "Total Messages",
        repliedMessages: "Replied Messages",
        replyRate: "Reply Rate",
        viewsToday: "Views Today",
        messagesRecent: "Messages Last 7 Days",
      },
      messagesTab: {
        title: "Anonymous Messages",
        publicReplies: {
          title: "Public Replies",
          active: "Active",
          inactive: "Inactive",
          activeDescription: "Visitors can reply to your messages",
          inactiveDescription: "Only you can reply to messages",
        },
        search: "Search messages...",
        filters: {
          all: "All",
          replied: "Replied",
          unreplied: "Unreplied",
        },
        noResults: {
          title: "No results",
          description: "No messages match your search",
        },
        noMessages: {
          title: "No messages yet",
          description: "Share your profile link to start receiving anonymous messages from your friends and followers.",
          shareButton: "Share Your Profile",
        },
        messageActions: {
          reply: "Reply",
          delete: "Delete",
          share: "Share",
        },
      },
      profileTab: {
        title: "Profile",
        preview: {
          title: "Profile Preview",
          viewPublic: "View Public Profile",
        },
        profilePhoto: {
          title: "Profile Photo",
          upload: "Upload Photo",
          change: "Change Photo",
          remove: "Remove Photo",
          dropzone: "Drag and drop your photo here, or click to select",
          sizeLimit: "Maximum size 2MB",
          uploading: "Uploading...",
        },
        username: {
          title: "Custom Username",
          current: "Current username:",
          active: "Active",
          notSet: "Not set",
          placeholder: "your-username",
          save: "Save Username",
          requirements: "Username can only contain letters, numbers, and hyphens",
          availability: {
            checking: "Checking availability...",
            available: "Username is available",
            unavailable: "Username is already taken",
            error: "Failed to check availability",
          },
        },
        name: {
          title: "Change Name",
          current: "Current name:",
          active: "Active",
          placeholder: "Your Name",
          save: "Save Name",
        },
        bio: {
          title: "Bio / Short Description",
          current: "Current bio:",
          filled: "Filled",
          empty: "Empty",
          placeholder: "Tell a bit about yourself...",
          save: "Save Bio",
          charactersLeft: "characters left",
        },
        socialMedia: {
          title: "Social Media Links",
          status: "Social media status:",
          active: "Active",
          empty: "Empty",
          instagram: "Instagram",
          facebook: "Facebook",
          linkedin: "LinkedIn",
          tiktok: "TikTok",
          placeholders: {
            instagram: "Your Instagram username",
            facebook: "Your Facebook username",
            linkedin: "Your LinkedIn username",
            tiktok: "Your TikTok username",
          },
          save: "Save Social Media Links",
        },
        notifications: {
          telegram: {
            title: "Telegram Notifications",
            status: "Status:",
            active: "Active",
            inactive: "Inactive",
            notSet: "Not set",
            connect: "Connect Telegram",
            disconnect: "Disconnect",
            instructions: "To receive Telegram notifications, connect your account with our Telegram bot:",
            connecting: "Connecting...",
            connectionCode: "Connection Code:",
            waitingConnection: "Waiting for connection...",
            connectionSuccess: "Telegram successfully connected!",
            connectionError: "Failed to connect Telegram",
          },
          whatsapp: {
            title: "WhatsApp Notifications",
            status: "Status:",
            active: "Active",
            inactive: "Inactive",
            notSet: "Not set",
            phoneLabel: "WhatsApp Number",
            phonePlaceholder: "Example: 628123456789",
            save: "Save Number",
            instructions: "Enter your WhatsApp number to receive notifications for new messages.",
          },
        },
        premiumFeatures: {
          title: "Premium Features",
          subtitle: "Upgrade to premium to access all profile features",
          upgradeButton: "Upgrade Now",
          features: {
            username: {
              title: "Custom Username",
              description: "Choose a unique username for your profile link",
            },
            name: {
              title: "Change Name",
              description: "Change your profile display name anytime",
            },
            profilePhoto: {
              title: "Profile Photo",
              description: "Upload your own profile photo",
            },
            bio: {
              title: "Profile Bio",
              description: "Add a short description about yourself",
            },
            socialMedia: {
              title: "Social Media Links",
              description: "Add Instagram, Facebook, LinkedIn, and TikTok links",
            },
            deleteMessages: {
              title: "Delete Messages",
              description: "Delete unwanted messages",
            },
          },
          benefits: {
            title: "Premium Benefits",
            items: {
              username: "Permanent custom username forever",
              profilePhoto: "Custom profile photo for your page personalization",
              socialLinks: "Add Instagram, Facebook, LinkedIn, and TikTok links",
              notifications: "Get instant notifications when you receive new messages",
              statistics: "View complete statistics of your profile visits and messages",
              publicReplies: "Enable public replies for your messages",
              customThemes: "Personalize your profile and message card appearance",
              deleteMessages: "Delete unwanted messages",
              shareProfile: "Share your profile with QR code",
              noAds: "Ad-free experience and priority support",
              lifetime: "Pay once, premium access forever",
            },
          },
        },
      },
      settingsTab: {
        title: "Account Settings",
        accountInfo: {
          title: "Account Information",
          name: "Name:",
          email: "Email:",
          status: {
            label: "Status:",
            premium: "Premium",
            free: "Free",
          },
          joined: "Joined:",
        },
        logout: {
          title: "Logout",
          description: "Log out from your account on this device. You can log back in anytime.",
          button: "Logout",
          processing: "Processing...",
        },
        deleteAccount: {
          title: "Delete Account",
          description: "Deleting your account will permanently remove all your data. This action cannot be undone.",
          button: "Delete Account",
          processing: "Processing...",
          confirmTitle: "Confirm Deletion",
          confirmDescription:
            "Are you sure you want to delete your account? All your data will be permanently deleted and cannot be recovered.",
          confirmButton: "Yes, Delete My Account",
          cancelButton: "Cancel",
        },
      },
      premiumBanner: {
        title: "Upgrade to Premium",
        description: "Get access to all premium features with a one-time payment.",
        upgradeButton: "Upgrade Now",
        alreadyPremium: "You already have a Premium account!",
        features: "View Premium Features",
      },
      profileQuickView: {
        yourProfile: "Your Profile",
        copyLink: "Copy Link",
        viewPublic: "View Profile",
        linkCopied: "Link copied to clipboard!",
      },
    },
    shareImage: {
      title: "Share as Image",
      description: "Create and share your message image easily",
      shareText: "I just received an anonymous message from someone 🤔",
      downloadButton: "Download",
      shareButton: "Share",
      successDownload: "Message image successfully downloaded",
      successShare: "Message image successfully shared",
      errorTitle: "Failed to share",
      errorDescription: "An error occurred while sharing the image",
    },
    premiumPromo: {
      message: "Use code to get premium access for free!",
    },
  },
}

export type Translations = typeof translations.id
