export type Locale = "id" | "en"

export type Translation = {
  home: {
    hero: {
      title: string
      subtitle: string
      cta: string
      userCount: string
    }
    testimonials: {
      title: string
      subtitle: string
      testimonial1: {
        name: string
        role: string
        text: string
      }
      testimonial2: {
        name: string
        role: string
        text: string
      }
      testimonial3: {
        name: string
        role: string
        text: string
      }
    }
    stats: {
      users: string
      messages: string
      satisfaction: string
      premium: string
    }
    premium: {
      badge: string
      title: string
      subtitle: string
      price: string
      discount: string
      savePercent: string
      oneTimePayment: string
      features: {
        username: string
        profilePhoto: string
        socialLinks: string
        notifications: string
        statistics: string
        publicReplies: string
        customThemes: string
        deleteMessages: string
        shareProfile: string
        noAds: string
        futureUpdates: string
      }
      guarantee: string
    }
  }
  common: {
    getStarted: string
    dashboard: string
    login: string
    register: string
    popular: string
  }
  nav: {
    language: string
  }
}

export const translations: Record<Locale, Translation> = {
  id: {
    home: {
      hero: {
        title: "Terima Pesan Anonim dari Siapapun",
        subtitle:
          "Platform untuk menerima pesan dan umpan balik secara anonim. Dapatkan kejujuran dari teman dan rekan kerja Anda.",
        cta: "Buat!",
        userCount: "30.000+ pengguna sudah bergabung!",
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
        guarantee: "Garansi 30 hari uang kembali. Tanpa risiko!",
      },
    },
    common: {
      getStarted: "Mulai Sekarang",
      dashboard: "Dashboard",
      login: "Masuk",
      register: "Daftar",
      popular: "Populer",
    },
    nav: {
      language: "Bahasa",
    },
  },
  en: {
    home: {
      hero: {
        title: "Receive Anonymous Messages from Anyone",
        subtitle:
          "A platform to receive anonymous messages and feedback. Get honest opinions from your friends and colleagues.",
        cta: "Create!",
        userCount: "30,000+ users have joined!",
      },
      testimonials: {
        title: "User Reviews",
        subtitle: "See what users are saying about their experience with Secretme",
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
          text: '"Game changer for my content! I get new ideas from anonymous messages and the social media link features really help with cross-promotion."',
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
        subtitle: "Get access to all premium Secretme features with a one-time payment. No monthly subscription fees!",
        price: "Rp 16,500",
        discount: "Rp 49,000",
        savePercent: "Save 38%",
        oneTimePayment: "One-time payment, lifetime access to all premium features",
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
        guarantee: "30-day money-back guarantee. No risk!",
      },
    },
    common: {
      getStarted: "Get Started",
      dashboard: "Dashboard",
      login: "Login",
      register: "Register",
      popular: "Popular",
    },
    nav: {
      language: "Language",
    },
  },
}
