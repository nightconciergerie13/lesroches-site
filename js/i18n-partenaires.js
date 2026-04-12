/* ─────────────────────────────────────────────────────────────────────────────
   Les Roches Retreat · Partner portal i18n
   Languages: fr (default) · en · es
   Usage: include this file, then call initI18n() after DOM ready.
───────────────────────────────────────────────────────────────────────────── */

var LR_I18N = {

  fr: {
    /* ── PAGE META ── */
    page_title_main:    'Espace Partenaires · Les Roches Retreat',
    page_title_tarifs:  'Tarifs Partenaires · Les Roches Retreat',

    /* ── GATE ── */
    gate_logo:          'Les Roches',
    gate_sub:           'Retreat · Espace Partenaires',
    gate_label:         'Code d\'accès',
    gate_btn:           'Accéder à l\'espace →',
    gate_err_wrong:     'Code incorrect. Réessayez.',
    gate_footer:        'Espace réservé aux professionnels du voyage agréés',

    /* ── NAV ── */
    nav_brand_sub:      'Espace Partenaires',
    nav_domaine:        'L\'établissement',
    nav_villas:         'Les villas',
    nav_tarifs:         'Tarifs',
    nav_process:        'Fonctionnement',
    nav_wa:             'WhatsApp',

    /* ── INTRO ── */
    intro_eyebrow:      'Accès professionnel exclusif',
    intro_title:        'Le partenariat le plus<br>simple du marché.',
    intro_sub:          'Nous avons conçu notre programme pour que chaque réservation soit fluide, rentable, et mémorable pour vos clients. Pas de complexité, pas de mauvaises surprises.',
    pillar1_title:      'Commission 15 %',
    pillar1_body:       'Tarif net partenaire à −15 % du prix public. Vous êtes libre de marger ou de faire bénéficier vos clients d’un meilleur prix. Aucun frais caché.',
    pillar2_title:      'Réponse sous 2 heures',
    pillar2_body:       'WhatsApp dédié partenaires, 7j/7. Option ferme de 48h sur chaque demande. Devis détaillé par retour immédiat.',
    pillar3_title:      'Vos clients au petit soin',
    pillar3_body:       'Accueil personnalisé, conciergerie sur mesure, expériences locales. Vos clients repartent avec l\'envie de revenir — et de recommander.',

    /* ── DOMAIN ── */
    domain_eyebrow:     'Santa Teresa · Péninsule de Nicoya',
    domain_title:       'Six villas privées sur les hauteurs du Pacifique.',
    domain_desc:        'Santa Teresa est l\'une des destinations les plus prisées d\'Amérique centrale : surf de classe mondiale, jungle tropicale, couchers de soleil légendaires. Les Roches Retreat est posé en hauteur, entre mer et forêt, à 10 minutes du centre de Santa Teresa, à 2h30 de San Jose.<br><br>Chaque villa est une maison privée avec piscine à débordement, vue Pacifique ou jungle, et architecture minimaliste tropicale. Un lieu pensé pour l\'expérience — pas pour la quantité.',
    tag_sanjose:        '2h30 de San Jose',
    tag_surf:           'Surf world-class',
    tag_villas:         '6 villas privées',
    tag_pool:           'Piscine à débordement',
    tag_view:           'Vue Pacifique',

    /* ── VILLAS SECTION ── */
    villas_eyebrow:     'Le domaine',
    villas_title:       'Six villas.<br>Six expériences uniques.',
    villas_sub:         'Chaque villa dispose de sa propre piscine à débordement et d\'une architecture minimaliste tropicale. Cliquez sur « Voir les photos » pour découvrir l\'intérieur en détail.',
    vcard_btn_photos:   'Voir les photos',
    vcard_btn_tarifs:   'Tarifs →',

    /* Villa descriptions */
    jade_specs:   '2 personnes · Piscine privée · Vue océan',
    jade_desc:    'La plus intimiste du domaine. Immergée dans la végétation, le Pacifique en contrebas. Idéale pour les couples à la recherche d\'isolement total.',
    topaze_specs: '2 personnes · Piscine privée · Coucher de soleil',
    topaze_desc:  'La plus lumineuse du domaine. Baignée par la lumière dorée du Pacifique à chaque fin de journée. Un coucher de soleil à couper le souffle, chaque soir.',
    onyx_specs:   '2 personnes · Piscine privée · Vue panoramique',
    onyx_desc:    'Au sommet du domaine. Lever de soleil panoramique de Mal Pais à Cabo Blanco. La villa la plus aérienne, pour ceux qui veulent voir le monde à leurs pieds.',
    agate_specs:  '4 personnes · Piscine privée · Niveau jardin',
    agate_desc:   'La plus spacieuse, la plus conviviale. Conçue pour les familles et groupes d\'amis avec accès direct au jardin tropical et vue ouverte.',
    ambre_specs:  '2–3 personnes · Piscine privée · Lumière ambre',
    ambre_desc:   'Elle tire son nom de la lumière ambre qui l\'inonde chaque soir. La piscine brille dorée au coucher du soleil. La villa des couples amoureux de la lumière.',
    opale_specs:  '2 personnes · Piscine privée · Vue changeante',
    opale_desc:   'Des reflets changeants selon la lumière du jour. Une surprise à chaque heure. La villa la plus mystérieuse — celle dont vos clients se souviendront longtemps.',

    /* ── CTA BAR ── */
    cta_bar_text: 'Une villa correspond à vos clients ?',
    cta_bar_btn:  'Écrire sur WhatsApp',

    /* ── LIVE RATES ── */
    live_eyebrow: 'Synchronisé en temps réel',
    live_title:   'Vos tarifs partenaires<br>en direct.',
    live_desc:    'Accédez au calendrier de disponibilités connecté à notre système de réservation. Les prix sont affichés à −15 % du tarif public, avec les nuits minimum par période. Mis à jour automatiquement à chaque modification de notre part.',
    live_btn:     'Consulter le calendrier des tarifs →',
    live_note:    'Données issues de notre panneau admin · Actualisées en temps réel',

    /* ── PROCESS ── */
    process_eyebrow: 'Simple. Rapide. Fiable.',
    process_title:   'Comment ça marche.',
    process_sub:     'De la demande à l\'arrivée de vos clients, tout est géré par nous. Vous n\'avez qu\'à envoyer la demande.',
    step1_title: 'Vous envoyez la demande',
    step1_body:  'Via WhatsApp ou le formulaire ci-dessous. Villa souhaitée, dates, nombre de personnes.',
    step2_title: 'On confirme sous 2h',
    step2_body:  'Disponibilité confirmée, option ferme de 48h, devis partenaire net envoyé immédiatement.',
    step3_title: 'Réservation et contrat',
    step3_body:  'Contrat de partenariat simple, acompte sécurisé. Tout est clair et documenté.',
    step4_title: 'Vos clients arrivent',
    step4_body:  'Accueil personnalisé, conciergerie sur mesure dès le premier jour. Vous n\'avez plus rien à faire.',

    /* ── FAQ ── */
    faq_eyebrow: 'Vos questions',
    faq_title:   'FAQ Partenaires.',
    faq1_q: 'Quel est le délai de confirmation d\'une réservation ?',
    faq1_a: 'Nous nous engageons à vous répondre sous 2 heures ouvrables, 7j/7. Dès réception de votre demande via WhatsApp ou formulaire, nous vous envoyons les disponibilités exactes et un devis net partenaire. Une option ferme de 48h est posée automatiquement à la demande.',
    faq2_q: 'Y a-t-il des frais cachés ou commissions supplémentaires ?',
    faq2_a: 'Aucun. Le tarif net partenaire affiché dans notre calendrier est le prix final que vous payez. La commission de 15 % est déjà intégrée dans ce tarif : vous vendez le prix public à vos clients, la différence est votre marge. Pas de frais de dossier, pas de frais cachés.',
    faq3_q: 'Comment fonctionne la politique d\'annulation ?',
    faq3_a: 'Notre politique partenaires est flexible et différenciée selon les délais. Les conditions exactes vous sont transmises avec chaque devis. En cas d\'annulation du client final, nous travaillons avec vous pour trouver la meilleure solution — report, crédit ou remboursement partiel selon le préavis.',
    faq4_q: 'Proposez-vous des expériences ou services additionnels pour nos clients ?',
    faq4_a: 'Oui. Notre conciergerie locale propose des transferts depuis San Jose, des cours de surf, du yoga, des excursions en kayak, des dîners privés au bord de la piscine et bien plus. Ces services peuvent être inclus dans votre package ou proposés en option. Nous vous transmettons le catalogue complet sur demande.',

    /* ── CONTACT ── */
    contact_eyebrow: 'Travaillons ensemble',
    contact_title:   'Prêt à proposer<br>Les Roches ?',
    contact_sub:     'Écrivez-nous directement sur WhatsApp — c\'est le moyen le plus rapide. On revient vers vous dans les 2 heures. Vous pouvez aussi nous envoyer un email si vous préférez.',
    contact_note:    'Réponse garantie sous 2 heures · Espace réservé aux professionnels agréés',

    /* ── FOOTER ── */
    footer_copy: '(c) 2025–2026 · Espace Partenaires · Accès confidentiel',
    /* ── VILLA SPECS (bullet points) ── */
    spec_bedrooms:      '2 chambres',
    spec_bathrooms:     '2 salles de bain privées',
    spec_pool:          'Piscine privée',
    spec_view_ocean:    'Vue océan',
    spec_view_sunset:   'Vue coucher de soleil',
    spec_view_panoramic:'Vue panoramique',
    spec_view_garden:   'Jardin tropical',


    /* ── MEDIA KIT ── */
    media_eyebrow:  'Ressources partenaires',
    media_title:    'Kit média.',
    media_sub:      'Téléchargez les photos haute résolution de chaque villa pour les envoyer directement à vos clients.',
    media_dl_btn:   'Télécharger les photos',
    media_dl_all:   'Tout télécharger (6 villas)',

    /* ── TARIFS PAGE ── */
    tarifs_nav_back:    '← Espace Partenaires',
    search_eyebrow:     'Recherche rapide',
    search_title:       'Disponibilités par dates',
    search_sub:         'Sélectionnez vos dates pour voir les tarifs partenaires (-15%) et la disponibilité des 6 villas en temps réel.',
    search_label_in:    'Arrivée',
    search_label_out:   'Départ',
    search_btn:         'Voir les villas disponibles →',
    result_avail:       'Disponible',
    result_partial:     'Partiellement dispo',
    result_unavail:     'Indisponible',
    result_nights:      'nuits',
    result_total:       'Total partenaire',
    result_avg:         'Moy. / nuit',
    result_minnights:   'Min.',
    result_wa_btn:      'Demander sur WhatsApp',
    result_nodata:      'Tarif non défini sur cette période',
    result_loading:     'Recherche en cours…',
  },

  /* ══════════════════════════════════════════════════════════════════════ EN */
  en: {
    page_title_main:    'Partner Portal · Les Roches Retreat',
    page_title_tarifs:  'Partner Rates · Les Roches Retreat',

    gate_logo:          'Les Roches',
    gate_sub:           'Retreat · Partner Portal',
    gate_label:         'Access code',
    gate_btn:           'Enter the portal →',
    gate_err_wrong:     'Incorrect code. Please try again.',
    gate_footer:        'Restricted to approved travel professionals',

    nav_brand_sub:      'Partner Portal',
    nav_domaine:        'The property',
    nav_villas:         'The villas',
    nav_tarifs:         'Rates',
    nav_process:        'How it works',
    nav_wa:             'WhatsApp',

    intro_eyebrow:      'Exclusive professional access',
    intro_title:        'The simplest partnership<br>in the market.',
    intro_sub:          'We designed our program to make every booking seamless, profitable, and unforgettable for your clients. No complexity, no unpleasant surprises.',
    pillar1_title:      '15% Commission',
    pillar1_body:       'Net partner rate at −15% off public price. You're free to keep the margin or pass savings on to your clients. No hidden fees.',
    pillar2_title:      'Reply within 2 hours',
    pillar2_body:       'Dedicated partner WhatsApp, 7 days a week. 48h firm option on every request. Detailed quote by return.',
    pillar3_title:      'Your clients cared for',
    pillar3_body:       'Personalized welcome, bespoke concierge service, local experiences. Your clients leave wanting to return — and to recommend.',

    domain_eyebrow:     'Santa Teresa · Nicoya Peninsula',
    domain_title:       'Six private villas above the Pacific.',
    domain_desc:        'Santa Teresa is one of Central America\'s most sought-after destinations: world-class surfing, tropical jungle, legendary sunsets. Les Roches Retreat sits elevated, between sea and forest, 10 minutes from central Santa Teresa, 2.5 hours from San Jose.<br><br>Each villa is a private home with an infinity pool, Pacific or jungle views, and tropical minimalist architecture. A place designed for the experience — not for volume.',
    tag_sanjose:        '2.5h from San Jose',
    tag_surf:           'World-class surf',
    tag_villas:         '6 private villas',
    tag_pool:           'Infinity pool',
    tag_view:           'Pacific view',

    villas_eyebrow:     'The estate',
    villas_title:       'Six villas.<br>Six unique experiences.',
    villas_sub:         'Each villa has its own infinity pool and tropical minimalist architecture. Click "View photos" to explore the interior in detail.',
    vcard_btn_photos:   'View photos',
    vcard_btn_tarifs:   'Rates →',

    jade_specs:   '2 guests · Private pool · Ocean view',
    jade_desc:    'The most intimate villa on the estate. Nestled in the vegetation with the Pacific below. Perfect for couples seeking total seclusion.',
    topaze_specs: '2 guests · Private pool · Sunset views',
    topaze_desc:  'The brightest on the estate. Bathed in the golden Pacific light every evening. A breathtaking sunset, every single night.',
    onyx_specs:   '2 guests · Private pool · Panoramic view',
    onyx_desc:    'At the peak of the estate. Panoramic sunrise from Mal Pais to Cabo Blanco. The most elevated villa, for those who want the world at their feet.',
    agate_specs:  '4 guests · Private pool · Garden level',
    agate_desc:   'The largest, most convivial villa. Designed for families and friend groups with direct access to the tropical garden and open views.',
    ambre_specs:  '2–3 guests · Private pool · Amber light',
    ambre_desc:   'Named after the amber light that floods it every evening. The pool glows golden at sunset. The villa for couples who love the light.',
    opale_specs:  '2 guests · Private pool · Shifting views',
    opale_desc:   'Shifting reflections with the light of the day. A different surprise every hour. The most mysterious villa — one your clients will remember for a long time.',

    cta_bar_text: 'Does a villa match your clients?',
    cta_bar_btn:  'Message on WhatsApp',

    live_eyebrow: 'Synced in real time',
    live_title:   'Your partner rates<br>live.',
    live_desc:    'Access the availability calendar connected to our booking system. Prices shown at −15% of public rate, with minimum nights per period. Automatically updated whenever we make changes.',
    live_btn:     'View the rates calendar →',
    live_note:    'Data from our admin panel · Updated in real time',

    process_eyebrow: 'Simple. Fast. Reliable.',
    process_title:   'How it works.',
    process_sub:     'From request to your clients\' arrival, everything is handled by us. All you need to do is send the request.',
    step1_title: 'You send the request',
    step1_body:  'Via WhatsApp or the form below. Desired villa, dates, number of guests.',
    step2_title: 'We confirm within 2h',
    step2_body:  'Availability confirmed, 48h firm option, net partner quote sent immediately.',
    step3_title: 'Booking & contract',
    step3_body:  'Simple partnership contract, secure deposit. Everything is clear and documented.',
    step4_title: 'Your clients arrive',
    step4_body:  'Personalized welcome, bespoke concierge from day one. Nothing left for you to do.',

    faq_eyebrow: 'Your questions',
    faq_title:   'Partner FAQ.',
    faq1_q: 'What is the confirmation turnaround for a booking?',
    faq1_a: 'We commit to replying within 2 business hours, 7 days a week. As soon as we receive your request via WhatsApp or form, we send you exact availability and a net partner quote. A 48h firm option is automatically applied on request.',
    faq2_q: 'Are there any hidden fees or additional commissions?',
    faq2_a: 'None. The net partner rate shown in our calendar is the final price you pay. The 15% commission is already built into this rate: you sell the public price to your clients, and the difference is your margin. No admin fees, no hidden charges.',
    faq3_q: 'How does the cancellation policy work?',
    faq3_a: 'Our partner policy is flexible and tiered according to lead time. Exact terms are provided with each quote. In the event of a cancellation by the end client, we work with you to find the best solution — rescheduling, credit, or partial refund depending on notice given.',
    faq4_q: 'Do you offer additional experiences or services for our clients?',
    faq4_a: 'Yes. Our local concierge offers transfers from San Jose, surf lessons, yoga, kayak excursions, private poolside dinners and much more. These can be included in your package or offered as add-ons. Full catalogue available on request.',

    contact_eyebrow: 'Let\'s work together',
    contact_title:   'Ready to offer<br>Les Roches?',
    contact_sub:     'Message us directly on WhatsApp — it\'s the fastest way. We\'ll get back to you within 2 hours. You can also email us if you prefer.',
    contact_note:    'Reply guaranteed within 2 hours · Reserved for approved professionals',

    footer_copy: '(c) 2025–2026 · Partner Portal · Confidential access',
    /* ── VILLA SPECS (bullet points) ── */
    spec_bedrooms:      '2 bedrooms',
    spec_bathrooms:     '2 private bathrooms',
    spec_pool:          'Private pool',
    spec_view_ocean:    'Ocean view',
    spec_view_sunset:   'Sunset view',
    spec_view_panoramic:'Panoramic view',
    spec_view_garden:   'Tropical garden',


    media_eyebrow:  'Partner resources',
    media_title:    'Media kit.',
    media_sub:      'Download high-resolution photos of each villa to send directly to your clients.',
    media_dl_btn:   'Download photos',
    media_dl_all:   'Download all (6 villas)',

    tarifs_nav_back:    '← Partner Portal',
    search_eyebrow:     'Quick search',
    search_title:       'Availability by dates',
    search_sub:         'Select your dates to see partner rates (−15%) and real-time availability for all 6 villas.',
    search_label_in:    'Check-in',
    search_label_out:   'Check-out',
    search_btn:         'See available villas →',
    result_avail:       'Available',
    result_partial:     'Partially available',
    result_unavail:     'Unavailable',
    result_nights:      'nights',
    result_total:       'Partner total',
    result_avg:         'Avg / night',
    result_minnights:   'Min.',
    result_wa_btn:      'Enquire on WhatsApp',
    result_nodata:      'Rate not set for this period',
    result_loading:     'Searching…',
  },

  /* ══════════════════════════════════════════════════════════════════════ ES */
  es: {
    page_title_main:    'Portal de Socios · Les Roches Retreat',
    page_title_tarifs:  'Tarifas para Socios · Les Roches Retreat',

    gate_logo:          'Les Roches',
    gate_sub:           'Retreat · Portal de Socios',
    gate_label:         'Código de acceso',
    gate_btn:           'Acceder al portal →',
    gate_err_wrong:     'Código incorrecto. Inténtelo de nuevo.',
    gate_footer:        'Reservado a profesionales del turismo acreditados',

    nav_brand_sub:      'Portal de Socios',
    nav_domaine:        'El establecimiento',
    nav_villas:         'Las villas',
    nav_tarifs:         'Tarifas',
    nav_process:        'Cómo funciona',
    nav_wa:             'WhatsApp',

    intro_eyebrow:      'Acceso profesional exclusivo',
    intro_title:        'La colaboración más sencilla<br>del mercado.',
    intro_sub:          'Hemos diseñado nuestro programa para que cada reserva sea fluida, rentable e inolvidable para sus clientes. Sin complejidad, sin sorpresas desagradables.',
    pillar1_title:      'Comisión del 15%',
    pillar1_body:       'Tarifa neta para socios a −15 % del precio público. Pueden conservar el margen o trasladar el ahorro a sus clientes. Sin cargos ocultos.',
    pillar2_title:      'Respuesta en 2 horas',
    pillar2_body:       'WhatsApp dedicado a socios, 7 días a la semana. Opción firme de 48h en cada solicitud. Presupuesto detallado de vuelta inmediata.',
    pillar3_title:      'Sus clientes en buenas manos',
    pillar3_body:       'Bienvenida personalizada, conserjería a medida, experiencias locales. Sus clientes se van con ganas de volver — y de recomendar.',

    domain_eyebrow:     'Santa Teresa · Península de Nicoya',
    domain_title:       'Seis villas privadas sobre el Pacífico.',
    domain_desc:        'Santa Teresa es uno de los destinos más buscados de América Central: surf de clase mundial, selva tropical, atardeceres legendarios. Les Roches Retreat está ubicado en altura, entre el mar y el bosque, a 10 minutos del centro de Santa Teresa, a 2,5 horas de San José.<br><br>Cada villa es una casa privada con piscina desbordante, vistas al Pacífico o a la selva, y arquitectura minimalista tropical. Un lugar pensado para la experiencia, no para el volumen.',
    tag_sanjose:        '2,5h de San José',
    tag_surf:           'Surf de clase mundial',
    tag_villas:         '6 villas privadas',
    tag_pool:           'Piscina desbordante',
    tag_view:           'Vista al Pacífico',

    villas_eyebrow:     'El dominio',
    villas_title:       'Seis villas.<br>Seis experiencias únicas.',
    villas_sub:         'Cada villa tiene su propia piscina desbordante y arquitectura minimalista tropical. Haga clic en «Ver fotos» para descubrir el interior en detalle.',
    vcard_btn_photos:   'Ver fotos',
    vcard_btn_tarifs:   'Tarifas →',

    jade_specs:   '2 personas · Piscina privada · Vista al océano',
    jade_desc:    'La más íntima del dominio. Inmersa en la vegetación, con el Pacífico al fondo. Ideal para parejas que buscan un aislamiento total.',
    topaze_specs: '2 personas · Piscina privada · Atardecer',
    topaze_desc:  'La más luminosa del dominio. Bañada por la luz dorada del Pacífico cada atardecer. Una puesta de sol impresionante, cada noche.',
    onyx_specs:   '2 personas · Piscina privada · Vista panorámica',
    onyx_desc:    'En la cima del dominio. Amanecer panorámico de Mal Pais a Cabo Blanco. La villa más elevada, para quienes quieren ver el mundo a sus pies.',
    agate_specs:  '4 personas · Piscina privada · Nivel jardín',
    agate_desc:   'La más espaciosa, la más acogedora. Diseñada para familias y grupos de amigos con acceso directo al jardín tropical y vistas abiertas.',
    ambre_specs:  '2–3 personas · Piscina privada · Luz ámbar',
    ambre_desc:   'Su nombre proviene de la luz ámbar que la inunda cada tarde. La piscina brilla dorada al atardecer. La villa de las parejas enamoradas de la luz.',
    opale_specs:  '2 personas · Piscina privada · Vistas cambiantes',
    opale_desc:   'Reflejos cambiantes según la luz del día. Una sorpresa a cada hora. La villa más misteriosa — la que sus clientes recordarán durante mucho tiempo.',

    cta_bar_text: '¿Una villa se adapta a sus clientes?',
    cta_bar_btn:  'Escribir por WhatsApp',

    live_eyebrow: 'Sincronizado en tiempo real',
    live_title:   'Sus tarifas de socio<br>en directo.',
    live_desc:    'Acceda al calendario de disponibilidad conectado a nuestro sistema de reservas. Los precios se muestran con un −15% sobre la tarifa pública, con las noches mínimas por período. Actualización automática con cada cambio de nuestra parte.',
    live_btn:     'Consultar el calendario de tarifas →',
    live_note:    'Datos del panel de administración · Actualizados en tiempo real',

    process_eyebrow: 'Simple. Rápido. Fiable.',
    process_title:   'Cómo funciona.',
    process_sub:     'Desde la solicitud hasta la llegada de sus clientes, todo lo gestionamos nosotros. Solo tiene que enviar la solicitud.',
    step1_title: 'Usted envía la solicitud',
    step1_body:  'Por WhatsApp o el formulario a continuación. Villa deseada, fechas, número de personas.',
    step2_title: 'Confirmamos en 2h',
    step2_body:  'Disponibilidad confirmada, opción firme de 48h, presupuesto neto enviado de inmediato.',
    step3_title: 'Reserva y contrato',
    step3_body:  'Contrato de colaboración sencillo, depósito seguro. Todo es claro y está documentado.',
    step4_title: 'Sus clientes llegan',
    step4_body:  'Bienvenida personalizada, conserjería a medida desde el primer día. Usted no tiene que hacer nada más.',

    faq_eyebrow: 'Sus preguntas',
    faq_title:   'FAQ para socios.',
    faq1_q: '¿Cuál es el plazo de confirmación de una reserva?',
    faq1_a: 'Nos comprometemos a responder en 2 horas hábiles, 7 días a la semana. En cuanto recibimos su solicitud por WhatsApp o formulario, le enviamos la disponibilidad exacta y un presupuesto neto. Se establece automáticamente una opción firme de 48h.',
    faq2_q: '¿Hay tarifas ocultas o comisiones adicionales?',
    faq2_a: 'Ninguna. La tarifa neta del socio que aparece en nuestro calendario es el precio final que paga. La comisión del 15% ya está incluida en esa tarifa: usted vende el precio público a sus clientes, y la diferencia es su margen. Sin gastos de gestión, sin cargos ocultos.',
    faq3_q: '¿Cómo funciona la política de cancelación?',
    faq3_a: 'Nuestra política para socios es flexible y escalonada según los plazos. Las condiciones exactas se proporcionan con cada presupuesto. En caso de cancelación del cliente final, trabajamos con usted para encontrar la mejor solución: aplazamiento, crédito o reembolso parcial según el preaviso.',
    faq4_q: '¿Ofrecen experiencias o servicios adicionales para nuestros clientes?',
    faq4_a: 'Sí. Nuestra conserjería local ofrece traslados desde San José, clases de surf, yoga, excursiones en kayak, cenas privadas junto a la piscina y mucho más. Estos servicios pueden incluirse en su paquete o proponerse como opciones. Catálogo completo disponible a petición.',

    contact_eyebrow: 'Trabajemos juntos',
    contact_title:   '¿Listo para ofrecer<br>Les Roches?',
    contact_sub:     'Escríbanos directamente por WhatsApp — es la forma más rápida. Le responderemos en 2 horas. También puede enviarnos un correo si lo prefiere.',
    contact_note:    'Respuesta garantizada en 2 horas · Reservado a profesionales acreditados',

    footer_copy: '(c) 2025–2026 · Portal de Socios · Acceso confidencial',
    /* ── VILLA SPECS (bullet points) ── */
    spec_bedrooms:      '2 habitaciones',
    spec_bathrooms:     '2 baños privados',
    spec_pool:          'Piscina privada',
    spec_view_ocean:    'Vista al océano',
    spec_view_sunset:   'Vista al atardecer',
    spec_view_panoramic:'Vista panorámica',
    spec_view_garden:   'Jardín tropical',


    media_eyebrow:  'Recursos para socios',
    media_title:    'Kit de medios.',
    media_sub:      'Descargue las fotos en alta resolución de cada villa para enviarlas directamente a sus clientes.',
    media_dl_btn:   'Descargar fotos',
    media_dl_all:   'Descargar todo (6 villas)',

    tarifs_nav_back:    '← Portal de Socios',
    search_eyebrow:     'Búsqueda rápida',
    search_title:       'Disponibilidad por fechas',
    search_sub:         'Seleccione sus fechas para ver las tarifas de socio (−15%) y la disponibilidad en tiempo real de las 6 villas.',
    search_label_in:    'Llegada',
    search_label_out:   'Salida',
    search_btn:         'Ver villas disponibles →',
    result_avail:       'Disponible',
    result_partial:     'Parcialmente disponible',
    result_unavail:     'No disponible',
    result_nights:      'noches',
    result_total:       'Total socio',
    result_avg:         'Prom. / noche',
    result_minnights:   'Mín.',
    result_wa_btn:      'Consultar por WhatsApp',
    result_nodata:      'Tarifa no definida para este período',
    result_loading:     'Buscando…',
  }
};

/* ─── Language detection & application ──────────────────────────────────── */

function detectLang() {
  var saved = localStorage.getItem('lr_partner_lang');
  if (saved && LR_I18N[saved]) return saved;
  var nav = (navigator.language || navigator.userLanguage || 'fr').toLowerCase();
  if (nav.startsWith('es')) return 'es';
  if (nav.startsWith('fr')) return 'fr';
  return 'en'; // default for all others (de, pt, it, zh, etc.)
}

function applyLang(lang, pageType) {
  if (!LR_I18N[lang]) lang = 'fr';
  var t = LR_I18N[lang];
  localStorage.setItem('lr_partner_lang', lang);

  // Update <html lang>
  document.documentElement.lang = lang;

  // Update page title
  if (pageType === 'tarifs') {
    document.title = t.page_title_tarifs;
  } else {
    document.title = t.page_title_main;
  }

  // Walk all data-i18n elements
  document.querySelectorAll('[data-i18n]').forEach(function(el) {
    var key = el.getAttribute('data-i18n');
    if (t[key] !== undefined) {
      if (el.getAttribute('data-i18n-html') === 'true') {
        el.innerHTML = t[key];
      } else {
        el.textContent = t[key];
      }
    }
  });

  // Walk all data-i18n-spec elements (villa bullet specs)
  document.querySelectorAll('[data-i18n-spec]').forEach(function(el) {
    var key = el.getAttribute('data-i18n-spec');
    if (t[key] \!== undefined) {
      el.textContent = t[key];
    }
  });

  // Update language switcher active state
  document.querySelectorAll('.lr-lang-btn').forEach(function(btn) {
    btn.classList.toggle('active', btn.getAttribute('data-lang') === lang);
  });
}

/* ─── Language switcher UI HTML ─────────────────────────────────────────── */
var LR_LANG_SWITCHER_HTML = '<div class="lr-lang-switcher" role="group" aria-label="Language">'
  + '<button class="lr-lang-btn" data-lang="fr" onclick="applyLang(\'fr\',LR_PAGE_TYPE)">FR</button>'
  + '<button class="lr-lang-btn" data-lang="en" onclick="applyLang(\'en\',LR_PAGE_TYPE)">EN</button>'
  + '<button class="lr-lang-btn" data-lang="es" onclick="applyLang(\'es\',LR_PAGE_TYPE)">ES</button>'
  + '</div>';

var LR_LANG_SWITCHER_CSS = [
  '.lr-lang-switcher{display:flex;gap:.3rem;align-items:center}',
  '.lr-lang-btn{font-family:\'Outfit\',sans-serif;font-size:.46rem;letter-spacing:.22em;font-weight:400;',
  'padding:.28rem .6rem;border:1px solid rgba(255,255,255,.2);background:transparent;color:rgba(255,255,255,.45);',
  'border-radius:2px;cursor:pointer;transition:all .2s;text-transform:uppercase}',
  '.lr-lang-btn:hover{color:rgba(255,255,255,.8);border-color:rgba(255,255,255,.5)}',
  '.lr-lang-btn.active{background:var(--ter);border-color:var(--ter);color:#fff}'
].join('');

function initI18n(pageType) {
  window.LR_PAGE_TYPE = pageType || 'main';

  // Inject CSS
  var style = document.createElement('style');
  style.textContent = LR_LANG_SWITCHER_CSS;
  document.head.appendChild(style);

  // Inject switcher into nav
  var navLinks = document.querySelector('.p-nav-links');
  if (navLinks) {
    var sw = document.createElement('div');
    sw.innerHTML = LR_LANG_SWITCHER_HTML;
    navLinks.insertBefore(sw.firstChild, navLinks.firstChild);
  }

  // Apply detected language
  applyLang(detectLang(), pageType);
}
