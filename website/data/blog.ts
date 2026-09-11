export type BlogPost = {
  slug: string;
  category: string;
  title: string;
  description: string;
  datePublished: string;
  dateModified: string;
  sections: Array<{ heading?: string; body: string; bullets?: string[] }>;
  citation?: string;
  citationLabel?: string;
  secondaryCitation?: string;
  secondaryCitationLabel?: string;
  image?: { src: string; alt: string; caption: string; width: number; height: number };
  faqs?: Array<{ question: string; answer: string }>;
};

export const blogPosts: BlogPost[] = [
  {
    slug: "jpjeplate-ice-hybrid-malaysia-rollout",
    category: "JPJePlate News",
    title: "JPJePlate for petrol, diesel and hybrid cars: what the new JPJ RFP means",
    description: "JPJ is seeking proposals for special plates covering ICE, hybrid, ZEV, OKU and trade vehicles. Here is what is confirmed, what remains unknown and when a wider JPJePlate rollout could happen.",
    datePublished: "2026-09-04",
    dateModified: "2026-09-04",
    citation: "https://www.facebook.com/share/p/19U51VF8TS/",
    citationLabel: "Official JPJ RFP announcement on Facebook",
    secondaryCitation: "https://paultan.org/2026/09/03/jpj-eplate-new-request-for-proposal-rfp-issued-for-ice-hybrid-oku-and-trade-vehicle-licence-plates/",
    secondaryCitationLabel: "Paul Tan's Automotive News report",
    image: {
      src: "/images/blog/jpj-rfp-special-plates-2026.png",
      alt: "Official JPJ 2026 request for proposal notice for special number plates covering ZEV, ICE, hybrid, OKU and trade plate vehicles",
      caption: "JPJ's official RFP notice for the proposed Rekaan Plat Khas programme. Image: Jabatan Pengangkutan Jalan Malaysia.",
      width: 1179,
      height: 725
    },
    sections: [
      {
        body: "JPJePlate may be moving beyond battery-electric vehicles. JPJ has opened a request for proposal (RFP) for a wider Rekaan Plat Khas, or special plate design, covering zero-emission vehicles, internal-combustion vehicles, hybrids, vehicles used by people with disabilities (OKU) and trade plates. This is a procurement step, not a public launch, but it is the clearest sign yet that Malaysia is preparing a standardised plate system for more vehicle categories."
      },
      {
        heading: "What JPJ has confirmed",
        body: "The RFP scope is wider than the current EV-focused JPJePlate programme. JPJ's official notice states that the advertisement runs from 1 to 11 September 2026, eligible companies must attend a briefing at 10am on 10 September, and proposals are due by 12 noon on 30 October 2026. JPJ has not announced a consumer launch date, final design, retail price or ordering process for non-EV vehicles.",
        bullets: [
          "The proposed scope includes ICE, hybrid, ZEV, OKU and trade-plate categories.",
          "The exercise is for qualified companies to propose how the programme could be developed and operated.",
          "An RFP does not by itself make the new plate available or compulsory for motorists."
        ]
      },
      {
        heading: "Which cars could receive the expanded JPJePlate?",
        body: "If the programme proceeds as reported, future coverage could include newly registered petrol and diesel cars, hybrid vehicles and other defined vehicle-use categories. Battery EVs already use the current JPJePlate, while the broader ZEV wording may also accommodate technologies such as hydrogen fuel-cell vehicles. The exact eligibility rules must still come from JPJ."
      },
      {
        heading: "Will every existing car need to change its number plate?",
        body: "There is no announcement requiring owners of existing petrol, diesel or hybrid cars to replace their current plates. Earlier statements about national plate standardisation pointed to a gradual rollout for newly registered vehicles, allowing vehicles already on the road to retain their existing plates. Motorcycles were also not part of the earlier expansion plan. Motorists should wait for JPJ's final rules before making any purchase decision."
      },
      {
        heading: "What might the new plate look like?",
        body: "The current EV JPJePlate uses an aluminium plate with embossed black characters on a white background and a green identifier strip. The Teksi Madani plate suggests that the same broad format can be adapted for other vehicle classes. Reports have mentioned possible silver, black or yellow identifiers for different powertrains, but JPJ has not confirmed those colours. Treat all proposed colour combinations as speculation until official specifications are published."
      },
      {
        heading: "When could JPJePlate become available for all new cars?",
        body: "Our best estimate is that 2027 is the earliest realistic watch window, not a confirmed launch date. The first JPJePlate procurement exercise began in 2023 and the EV plate launched in September 2024, roughly a year later. If the new RFP follows a similar path after proposals close in October 2026, a phased introduction during 2027 is plausible. A broader programme is more complex, however, so testing, supplier selection, dealer readiness, production capacity and final regulations could push implementation later."
      },
      {
        heading: "Why Malaysia is standardising vehicle plates",
        body: "A consistent plate format can improve legibility and enforcement while reducing non-compliant decorative plates and opportunities for vehicle cloning. The current JPJePlate also combines controlled production with security and identification features. Expanding that framework would give JPJ a common standard across more newly registered vehicles."
      },
      {
        heading: "Can you order an ICE or hybrid JPJePlate from ePlate.my now?",
        body: "Not yet. ePlate.my is an independent third-party ordering marketplace and is not JPJ or a government website. We currently accept orders only for eligible ZEV/EV vehicles under the existing JPJePlate programme. We will update this guide when JPJ confirms the launch date, eligibility, pricing and ordering rules for petrol, diesel and hybrid vehicles."
      }
    ],
    faqs: [
      {
        question: "Is JPJePlate available for petrol or diesel cars in Malaysia now?",
        answer: "No public ordering launch has been announced for petrol or diesel cars. JPJ's RFP is an early procurement step for a possible wider rollout."
      },
      {
        question: "When will JPJePlate be available for hybrid cars?",
        answer: "JPJ has not confirmed a date. Based on the earlier EV rollout, 2027 is a plausible earliest watch window, but this is only an estimate and implementation could take longer."
      },
      {
        question: "Will existing cars have to replace their current number plates?",
        answer: "No such requirement has been announced. Earlier government statements indicated that standardisation would focus on newly registered vehicles and existing vehicles could retain their current plates."
      },
      {
        question: "Is ePlate.my an official JPJ website?",
        answer: "No. ePlate.my is an independent third-party ordering marketplace that helps eligible customers with JPJePlate ordering and installation support."
      }
    ]
  },
  {
    slug: "how-unique-tid-secures-jpjeplate-rfid",
    category: "RFID Security",
    title: "How unique TID secures JPJePlate RFID technology",
    description: "Learn how JPJePlate RFID security uses a unique TID, EPC data, and official enrolment to reduce cloning and improve vehicle identification.",
    datePublished: "2026-05-19",
    dateModified: "2026-05-19",
    citation: "https://www.timeteccloud.com/blog/how-the-unique-tid-secures-jpj-eplate-rfid-technology/",
    sections: [
      { body: "JPJePlate is not only a different-looking plate. Its security model depends on a controlled plate set, RFID identity, QR-linked serial information, and installation through the official channel." },
      { heading: "What TID means", body: "TID is a chip identity used in RFID systems. For drivers, the practical point is that the plate identity should match the vehicle record rather than being treated as a decorative accessory." },
      { heading: "Why authorised installation matters", body: "A plate that looks right can still fail the official process if the RFID and records are not correctly matched. Avoid unofficial replacements or shortcuts." }
    ]
  },
  {
    slug: "jpjeplate-johor-bahru-guide",
    category: "Johor Bahru Guide",
    title: "JPJePlate in Johor Bahru: what drivers need to know",
    description: "A Johor Bahru driver guide to JPJePlate ordering, delivery, documents, pricing, and professional eplate installation.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "Johor Bahru drivers can reduce back-and-forth by preparing vehicle details and documents before visiting the workshop." },
      { heading: "What ePlate.my handles", body: "ePlate.my provides order support, document checking, secure ToyyibPay payment, delivery coordination, and installation scheduling for eligible ZEV/EV JPJePlate orders." },
      { heading: "What to prepare", body: "Have your registration number, chassis/VIN, VOC/geran and MyKad ready. Complete payment online before installation is scheduled." }
    ]
  },
  {
    slug: "eplate-price-malaysia-rm150",
    category: "Pricing",
    title: "How much does an eplate cost in Malaysia?",
    description: "Understand the difference between the official JPJePlate plate set price and the RM150 ePlate.my installed package in Johor Bahru.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-04",
    sections: [
      { body: "The official JPJePlate set price is RM98. A local installed service package can cost more because it includes handling, delivery coordination, installation, and support." },
      { heading: "ePlate.my package", body: "The ePlate.my package shown on this site is RM150 for eligible ZEV/EV orders handled through the Johor Bahru workshop." },
      { heading: "Compare properly", body: "When comparing prices, check whether the amount includes order support, delivery coordination, installation, invoice handling, and follow-up support." }
    ]
  },
  {
    slug: "documents-needed-for-jpjeplate",
    category: "Documents",
    title: "Documents needed to order a JPJePlate",
    description: "Checklist of documents and details usually needed to order a JPJePlate electronic number plate in Malaysia.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "Ordering is faster when your documents are ready before admin review. Clear photos and accurate details help prevent delays." },
      { heading: "Basic checklist", body: "Prepare the owner name, registration number, chassis/VIN, VOC/geran and MyKad. Pay online through ToyyibPay.", bullets: ["Vehicle Ownership Certificate or geran.", "MyKad photo.", "Vehicle registration number.", "Chassis/VIN.", "Online payment confirmation."] },
      { heading: "Keep records", body: "Keep your order, invoice, appointment, and installation messages in one place for easier follow-up." }
    ]
  },
  {
    slug: "what-is-jpjeplate",
    category: "JPJePlate Basics",
    title: "What is JPJePlate?",
    description: "Learn what JPJePlate is, why Malaysia introduced electronic number plates, and what drivers should know before ordering.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "JPJePlate is Malaysia's official electronic number plate initiative by MOT and JPJ, currently positioned around the ZEV/EV rollout." },
      { heading: "Why it exists", body: "The system is designed for better visibility, standardisation, anti-counterfeit protection, vehicle identification, and future RFID-based transport systems." },
      { heading: "Who should order now", body: "For v1, ePlate.my accepts ZEV/EV JPJePlate orders only and checks eligibility before admin submission." }
    ]
  },
  {
    slug: "jpjeplate-features-rfid-safety",
    category: "Features",
    title: "JPJePlate features: RFID, safety, and anti-counterfeit design",
    description: "Understand JPJePlate features including standardisation, RFID readiness, anti-counterfeit design, and road safety benefits.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "JPJePlate includes physical and digital security features intended to make plates easier to identify and harder to counterfeit." },
      { heading: "Commonly stated features", body: "Official JPJePlate materials describe features such as the Malaysian flag, MAL mark, holographic elements, QR digital signature, serial number, embedded RFID, and security screws." },
      { heading: "Driver benefit", body: "For drivers, the practical benefit is a more standardised plate with clearer installation and record handling." }
    ]
  },
  {
    slug: "jpjeplate-delivery-installation-timeline",
    category: "Timeline",
    title: "JPJePlate delivery and installation timeline",
    description: "Understand the JPJePlate delivery and installation timeline, from document submission to workshop fitting in Johor Bahru.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "The timeline depends on document accuracy, admin review, payment confirmation, JPJePlate processing, delivery, weekends, and public holidays." },
      { heading: "Typical flow", body: "Submit order, upload documents, pay through ToyyibPay, wait for admin review, then wait for production and delivery to the workshop." },
      { heading: "Installation", body: "After the plate arrives, ePlate.my schedules a workshop appointment and the vehicle is brought in for fitting." }
    ]
  },
  {
    slug: "lost-damaged-jpjeplate-replacement",
    category: "Replacement",
    title: "Lost or damaged JPJePlate: what should you do?",
    description: "What Malaysian drivers should do if a JPJePlate electronic number plate is lost, damaged, loose, or needs replacement checking.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "If your JPJePlate is missing, damaged, or loose, document the issue and contact the installer or official support channel that handled the order." },
      { heading: "Recommended steps", body: "Take clear photos, keep invoice/order details, avoid unofficial replacements, and ask for the correct replacement process." },
      { heading: "Why not DIY", body: "JPJePlate includes official identity and security features. Unofficial modifications can create registration and verification problems." }
    ]
  },
  {
    slug: "authorised-jpjeplate-installer-malaysia",
    category: "Installer Guide",
    title: "How to choose a JPJePlate installer in Malaysia",
    description: "Questions to ask before choosing a JPJePlate installer in Malaysia, including pricing, documents, installation location, and support.",
    datePublished: "2026-05-03",
    dateModified: "2026-05-03",
    sections: [
      { body: "A good installer should be clear about eligibility, price, documents, installation location, invoice, and follow-up support." },
      { heading: "Questions to ask", body: "Ask what is included in the package, whether the vehicle is eligible, how documents are handled, where installation happens, and how status updates are provided." },
      { heading: "Keep proof", body: "Keep payment proof, invoice, appointment details, and any messages about installation." }
    ]
  }
];

export function getBlogPost(slug: string) {
  return blogPosts.find((post) => post.slug === slug);
}
