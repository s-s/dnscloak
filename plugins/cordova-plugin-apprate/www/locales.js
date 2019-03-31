/*
 *
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 *
 */
;
var Locale, Locales;

Locale = (function () {
  function Locale(arg) {
    for (var index in arg) {
      if (arg.hasOwnProperty(index)) {
        this[index] = arg[index] || '';
      }
    }
    this;
  }

  return Locale;

})();

Locales = (function() {
  var LOCALE_DEFAULT, locales;

  function Locales() {}

  LOCALE_DEFAULT = 'en';

  locales = {};

  Locales.addLocale = function(localeObject) {
    return locales[localeObject.language] = localeObject;
  };

  Locales.getLocale = function(language, applicationTitle, customLocale) {
    var localeObject;
    if (applicationTitle == null) {
      applicationTitle = '';
    }
    localeObject = customLocale || locales[language] || locales[language.split(/-/)[0]] || locales[LOCALE_DEFAULT];
    localeObject = Object.assign({}, locales[LOCALE_DEFAULT], localeObject);	//use entries of default locale as fallback for unset entries
    localeObject.title = localeObject.title.replace(/%@/g, applicationTitle);
    localeObject.appRatePromptTitle = (localeObject.appRatePromptTitle || '').replace(/%@/g, applicationTitle);
    localeObject.feedbackPromptTitle = (localeObject.feedbackPromptTitle || '').replace(/%@/g, applicationTitle);
    localeObject.appRatePromptMessage = (localeObject.appRatePromptMessage || '').replace(/%@/g, applicationTitle);
    localeObject.feedbackPromptMessage = (localeObject.feedbackPromptMessage || '').replace(/%@/g, applicationTitle);
    localeObject.message = localeObject.message.replace(/%@/g, applicationTitle);
    return localeObject;
  };

  Locales.getLocalesNames = function () {
    var locale, results;
    results = [];
    for (locale in locales) {
      results.push(locale);
    }
    return results;
  };

  return Locales;

})();

Locales.addLocale(new Locale({
  language: 'ar',
  title: "قيِّم %@",
  message: "إذا أعجبك برنامج %@، هل تمانع من أخذ دقيقة لتقييمه؟ شكرا لدعمك",
  cancelButtonLabel: "لا، شكراً",
  laterButtonLabel: "ذكرني لاحقاً",
  rateButtonLabel: "قيم البرنامج الآن"
}));

Locales.addLocale(new Locale({
  language: 'bn',
  title: "রেট %@",
  message: "মাত্র এক মিনিট ব্যয় করুন এবং আমাদের এ্যপের প্রচারে সহায়তা করুন। আপনার সহযোগীতার জন্য ধন্যবাদ",
  cancelButtonLabel: "না, ধন্যবাদ",
  laterButtonLabel: "আমাকে পরে মনে করিয়ে দিন",
  rateButtonLabel: "এখন এটি রেটিং দিন",
  yesButtonLabel: "হ্যাঁ!",
  noButtonLabel: "সত্যিই না",
  appRatePromptTitle: '%@ ব্যবহার করে ভালো লেগেছে কি?',
  feedbackPromptTitle: 'কিছু মতামত দিবেন কি?',
}));

Locales.addLocale(new Locale({
  language: 'ca',
  title: "Ressenya %@",
  message: "Si t'agrada %@, podries escriure una ressenya? No et prendrà més d'un minut. Gràcies pel teu suport!",
  cancelButtonLabel: "No, gràcies",
  laterButtonLabel: "Recorda-m'ho més tard",
  rateButtonLabel: "Escriure una ressenya ara"
}));

Locales.addLocale(new Locale({
  language: 'cs',
  title: "Ohodnotit %@",
  message: "Pokud se vám líbí %@, našli byste si chvilku na ohodnocení aplikace? Nebude to trvat víc než minutu.\nDěkujeme za vaši podporu!",
  cancelButtonLabel: "Ne, děkuji",
  laterButtonLabel: "Připomenout později",
  rateButtonLabel: "Ohodnotit nyní"
}));

Locales.addLocale(new Locale({
  language: 'da',
  title: "Vurdér %@",
  message: "Hvis du kan lide at bruge %@, vil du så ikke bruge et øjeblik på at give en vurdering? Det tager ikke mere end et minut. Mange tak for hjælpen!",
  cancelButtonLabel: "Nej tak",
  laterButtonLabel: "Påmind mig senere",
  rateButtonLabel: "Vurdér nu"
}));

Locales.addLocale(new Locale({
  language: 'de',
  title: "Bewerte %@",
  message: "Wenn dir %@ gefällt, würdest Du es bitte bewerten? Dies wird nicht länger als eine Minute dauern. Danke für die Unterstützung!",
  cancelButtonLabel: "Nein, danke",
  laterButtonLabel: "Später erinnern",
  rateButtonLabel: "Jetzt bewerten",
  yesButtonLabel: "Ja!",
  noButtonLabel: "Nicht wirklich",
  appRatePromptTitle: 'Gefällt dir %@',
  feedbackPromptTitle: 'Würdest du uns eine kurze Rückmeldung geben?',
  appRatePromptMessage:'',
  feedbackPromptMessage:''
}));

Locales.addLocale(new Locale({
  language: 'de-AT',
  title: "Bewerte %@",
  message: "Wenn dir %@ gefällt, würdest Du es bitte bewerten? Dies wird nicht länger als eine Minute dauern.\nDanke für die Unterstützung!",
  cancelButtonLabel: "Nein, danke",
  laterButtonLabel: "Später erinnern",
  rateButtonLabel: "Jetzt bewerten",
  yesButtonLabel: "Ja!",
  noButtonLabel: "Nicht wirklich",
  appRatePromptTitle: 'Gefällt dir %@',
  feedbackPromptTitle: 'Würdest du uns eine kurze Rückmeldung geben?',
  appRatePromptMessage:'',
  feedbackPromptMessage:''
}));

Locales.addLocale(new Locale({
  language: 'el',
  title: "Αξιολόγησε %@",
  message: "Αν σ' αρέσει η εφαρμογή %@, θα μπορούσες να αφιερώσεις ένα δευτερόλεπτο για να την αξιολογήσεις; Ευχαριστούμε για την υποστήριξη!",
  cancelButtonLabel: "Όχι, ευχαριστώ",
  laterButtonLabel: "Υπενθύμιση αργότερα",
  rateButtonLabel: "Αξιολόγησε τώρα"
}));

Locales.addLocale(new Locale({
  language: 'en',
  title: "Would you mind rating %@?",
  message: "It won’t take more than a minute and helps to promote our app. Thanks for your support!",
  cancelButtonLabel: "No, Thanks",
  laterButtonLabel: "Remind Me Later",
  rateButtonLabel: "Rate It Now",
  yesButtonLabel: "Yes!",
  noButtonLabel: "Not really",
  appRatePromptTitle: 'Do you like using %@',
  feedbackPromptTitle: 'Mind giving us some feedback?',
  appRatePromptMessage:'',
  feedbackPromptMessage:''
}));

Locales.addLocale(new Locale({
  language: 'es',
  title: "Reseña %@",
  message: "Si te gusta %@, ¿podrías escribirnos una reseña? No te tomará más de un minuto. ¡Gracias por tu apoyo!",
  cancelButtonLabel: "No, gracias",
  laterButtonLabel: "Recordarme más tarde",
  rateButtonLabel: "Escribir reseña ahora"
}));

Locales.addLocale(new Locale({
  language: 'eu',
  title: "%@ iruzkindu nahi?",
  message: "%@ gustuko baduzu asko eskertuko genuke zure iruzkina, minutu bat baino gutxiago izango da. Eskerrik asko zure laguntzagatik!",
  cancelButtonLabel: "Ez, Eskerrik asko",
  laterButtonLabel: "Beranduago gogoratu",
  rateButtonLabel: "Iruzkindu orain",
  yesButtonLabel: "Bai!",
  noButtonLabel: "Ez",
  appRatePromptTitle: 'Gustuko duzu %@ ?',
  feedbackPromptTitle: 'Iruzkin bat lagatzerik nahi?',
  appRatePromptMessage:'',
  feedbackPromptMessage:''
}));

Locales.addLocale(new Locale({
  language: 'fa',
  title: "نرخ %@",
  message: "اگر شما با استفاده از %@ لذت بردن از، اشکالی ندارد یک لحظه به امتیاز دهی هستند؟ آن را نمی خواهد بیشتر از یک دقیقه طول بکشد. با تشکر از حمایت شما!",
  cancelButtonLabel: "نه، با تشکر",
  laterButtonLabel: "یادآوری من بعد",
  rateButtonLabel: "آن را دوست ندارم حالا"
}));

Locales.addLocale(new Locale({
  language: 'fi',
  title: "Arvostele %@",
  message: "Jos tykkäät %@ sovelluksesta, haluatko kirjoittaa sille arvostelun? Arvostelun kirjoittamiseen ei mene montaa minuuttia. Kiitos tuestasi!",
  cancelButtonLabel: "Ei kiitos",
  laterButtonLabel: "Muistuta minua myöhemmin",
  rateButtonLabel: "Arvostele nyt"
}));

Locales.addLocale(new Locale({
  language: 'fr',
  title: "Notez %@",
  message: "Si vous aimez utiliser %@, n’oubliez pas de voter sur l’App Store. Cela ne prend qu’une minute. Merci d’avance pour votre soutien !",
  cancelButtonLabel: "Non, merci",
  laterButtonLabel: "Me le rappeler ultérieurement",
  rateButtonLabel: "Votez maintenant"
}));

Locales.addLocale(new Locale({
  language: 'he',
  title: "דרג את %@",
  message: "אם אתה נהנה להשתמש ב- %@, אתה מוכן לקחת רגע כדי לדרג את התוכנה? זה לא ייקח יותר מדקה. תודה על התמיכה!",
  cancelButtonLabel: "לא, תודה",
  laterButtonLabel: "הזכר לי מאוחר יותר",
  rateButtonLabel: "דרג עכשיו"
}));

Locales.addLocale(new Locale({
  language: 'hi',
  title: "दर %@",
  message: "आप %@ उपयोग का आनंद ले, तो आप यह दर क्षण ले मन होगा? यह एक मिनट से अधिक नहीं ले जाएगा. आपके समर्थन के लिए धन्यवाद!",
  cancelButtonLabel: "नहीं, धन्यवाद",
  laterButtonLabel: "मुझे बाद में याद दिलाएं",
  rateButtonLabel: "अब यह दर"
}));

Locales.addLocale(new Locale({
  language: 'id',
  title: "Beri Nilai %@",
  message: "Jika anda senang menggunakan %@, maukah anda memberikan nilai? Ini Hanya Sebentar. Terima kasih atas dukungan Anda!",
  cancelButtonLabel: "Tidak, Terimakasih",
  laterButtonLabel: "Ingatkan saya lagi",
  rateButtonLabel: "Berikan nilai sekarang!"
}));

Locales.addLocale(new Locale({
  language: 'it',
  title: "Valuta %@",
  message: "Ti piace %@? Puoi dare il tuo voto nello store. Ti basterà un minuto! Grazie!",
  cancelButtonLabel: "No, grazie",
  laterButtonLabel: "Più tardi",
  rateButtonLabel: "Valuta ora"
}));

Locales.addLocale(new Locale({
  language: 'ja',
  title: "%@の評価",
  message: "%@をお使いいただき大変ありがとうございます。もしよろしければ1分程で済みますので、このアプリの評価をお願いします。ご協力感謝いたします！",
  cancelButtonLabel: "いえ、結構です",
  laterButtonLabel: "後でする",
  rateButtonLabel: "今すぐ評価する"
}));

Locales.addLocale(new Locale({
  language: 'ko',
  title: "%@ 평가하기",
  message: "%@ 앱을 사용해 보신 소감이 어떠신가요? 리뷰 작성을 부탁 드립니다. 길어도 1분이면 작성하실 수 있을 것입니다. 도움 감사 드립니다.",
  cancelButtonLabel: "괜찮습니다",
  laterButtonLabel: "나중에 다시 알림",
  rateButtonLabel: "지금 평가하기"
}));

Locales.addLocale(new Locale({
  language: 'nl',
  title: "Beoordeel %@",
  message: "Als het gebruik van %@ je bevalt, wil je dan een moment nemen om het te beoordelen? Het duurt nog geen minuut. Bedankt voor je steun!",
  cancelButtonLabel: "Nee, bedankt",
  laterButtonLabel: "Herinner me er later aan",
  rateButtonLabel: "Beoordeel nu"
}));

Locales.addLocale(new Locale({
  language: 'no',
  title: "Vurder %@",
  message: "Hvis du liker å bruke %@, ville du vært grei å vurdere appen? Det vil ikke ta mer enn et minutt. Takk for hjelpen!",
  cancelButtonLabel: "Ellers takk",
  laterButtonLabel: "Påminn meg senere",
  rateButtonLabel: "Vurder nå"
}));

Locales.addLocale(new Locale({
  language: 'pa',
  title: "ਦਰ %@",
  message: "ਤੁਹਾਨੂੰ %@ ਵਰਤ ਆਨੰਦ ਹੋ, ਤੁਹਾਨੂੰ ਇਸ ਨੂੰ ਦਾ ਦਰਜਾ ਦਿੰਦੇ ਹਨ ਕਰਨ ਲਈ ਇੱਕ ਪਲ ਲੈ ਕੇ ਯਾਦ ਹੋਵੇਗਾ? ਇਸ ਨੂੰ ਇੱਕ ਮਿੰਟ ਵੀ ਵੱਧ ਲੱਗ ਨਹ ਹੋਵੇਗਾ. ਤੁਹਾਡੇ ਸਹਿਯੋਗ ਲਈ ਲਈ ਧੰਨਵਾਦ!",
  cancelButtonLabel: "ਕੋਈ, ਦਾ ਧੰਨਵਾਦ ਹੈ",
  laterButtonLabel: "ਮੈਨੂੰ ਬਾਅਦ ਵਿੱਚ ਯਾਦ",
  rateButtonLabel: "ਹੁਣ ਇਹ ਦਰ ਨੂੰ"
}));

Locales.addLocale(new Locale({
  language: 'pl',
  title: "Oceń %@",
  message: "Jeśli lubisz %@, czy mógłbyś poświęcić chwilę na ocenienie? To nie zajmie więcej niż minutę. Dziękujemy za wsparcie!",
  cancelButtonLabel: "Nie, dziękuję",
  laterButtonLabel: "Przypomnij później",
  rateButtonLabel: "Oceń teraz"
}));

Locales.addLocale(new Locale({
  language: 'pt',
  title: "Avaliar %@",
  message: "Se você gostou de usar o %@, você se importaria de avaliá-lo? Não vai demorar mais de um minuto. Obrigado por seu apoio!",
  cancelButtonLabel: "Não, obrigado",
  laterButtonLabel: "Lembrar mais tarde",
  rateButtonLabel: "Avaliar Agora",
  yesButtonLabel: "Sim!",
  noButtonLabel: "Não",
  appRatePromptTitle: "Você gosta de usar %@",
  feedbackPromptTitle: "Poderia nos dar um feedback?",
  appRatePromptMessage: "",
  feedbackPromptMessage: ""
}));

Locales.addLocale(new Locale({
  language: 'pt-PT',
  title: "Avaliar %@",
  message: "Se gostou de utilizar o %@, importa-se de o avaliar? Não vai demorar mais do que um minuto. Obrigado pelo seu apoio!",
  cancelButtonLabel: "Não, obrigado",
  laterButtonLabel: "Lembrar mais tarde",
  rateButtonLabel: "Avaliar agora",
  yesButtonLabel: "Sim!",
  noButtonLabel: "Não",
  appRatePromptTitle: "Você gosta de utilizar %@",
  feedbackPromptTitle: "Poderia nos dar um feedback?",
  appRatePromptMessage: "",
  feedbackPromptMessage: ""
}));

Locales.addLocale(new Locale({
  language: 'ru',
  title: "Оцените %@",
  message: "Если вам нравится пользоваться %@, не будете ли вы возражать против того, чтобы уделить минуту и оценить его?\nСпасибо вам за поддержку!",
  cancelButtonLabel: "Нет, спасибо",
  laterButtonLabel: "Напомнить позже",
  rateButtonLabel: "Оценить сейчас",
  yesButtonLabel: "Да!",
  noButtonLabel: "Нет",
  appRatePromptTitle: "Вам нравится приложение?",
  feedbackPromptTitle: "Не могли бы вы дать нам обратную связь?"
}));

Locales.addLocale(new Locale({
  language: 'sk',
  title: "Ohodnotiť %@",
  message: "Ak sa vám páči %@, našli by ste si chvíľku na ohodnotenie aplikácie? Nebude to trvať viac ako minútu.\nĎakujeme za vašu podporu!",
  cancelButtonLabel: "Nie, Ďakujem",
  laterButtonLabel: "Pripomenúť neskôr",
  rateButtonLabel: "Ohodnotiť teraz"
}));

Locales.addLocale(new Locale({
  language: 'sl',
  title: "Oceni %@",
  message: "Če vam je %@ všeč, bi vas prosili, da si vzamete moment in ocenite? Ne bo vam vzelo več kot minuto. Hvala za vašo podporo!",
  cancelButtonLabel: "Ne, hvala",
  laterButtonLabel: "Spomni me kasneje",
  rateButtonLabel: "Oceni zdaj"
}));

Locales.addLocale(new Locale({
  language: 'sv',
  title: "Betygsätt %@",
  message: "Gillar du %@ och kan tänka dig att betygsätta den? Det tar inte mer än en minut. Tack för ditt stöd!",
  cancelButtonLabel: "Nej tack",
  laterButtonLabel: "Påminn mig senare",
  rateButtonLabel: "Betygsätt nu!"
}));

Locales.addLocale(new Locale({
  language: 'ta',
  title: "%@ மதிப்பிடு",
  message: "%@ பிடித்திருந்தால், நீங்கள் அதை மதிப்பிட ஒரு கணம் எடுக்க முடியுமா? அது ஒரு நிமிடம் தான் எடுக்கும். உங்கள் ஒத்துழைப்புக்கு நன்றி!",
  cancelButtonLabel: "இல்லை, நன்றி",
  laterButtonLabel: "பின்னர் நினைவூட்டு",
  rateButtonLabel: "இப்போது மதிப்பிடு"
}));

Locales.addLocale(new Locale({
  language: 'th',
  title: "อัตรา %@",
  message: "หากคุณเพลิดเพลินกับการใช้ %@ คุณจะคิดสละเวลาให้คะแนนมันได้หรือไม่ มันจะไม่ใช้เวลานานกว่าหนึ่งนาที ขอบคุณสำหรับการสนับสนุนของคุณ",
  cancelButtonLabel: "ไม่ขอบคุณ",
  laterButtonLabel: "กรุณาเตือนผมมา",
  rateButtonLabel: "ให้คะแนนตอนนี้"
}));

Locales.addLocale(new Locale({
  language: 'tr',
  title: "Oy %@",
  message: "Eğer %@ uygulamamız hoşunuza gittiyse, oy vermek ister misiniz? Bir dakikadan fazla sürmeyecektir. Desteğiniz için teşekkürler!",
  cancelButtonLabel: "Teşekkürler, Hayır",
  laterButtonLabel: "Sonra Hatırlat",
  rateButtonLabel: "Şimdi Oyla"
}));

Locales.addLocale(new Locale({
  language: 'uk',
  title: "Оцінити %@",
  message: "Якщо вам подобається користуватися %@, чи не будете ви заперечувати проти того, щоб приділити хвилинку та оцінити її? Спасибі вам за підтримку!",
  cancelButtonLabel: "Ні, дякую",
  laterButtonLabel: "Нагадати пізніше",
  rateButtonLabel: "Оцінити зараз",
  yesButtonLabel: "Так!",
  noButtonLabel: "Ні",
  appRatePromptTitle: "Вам подобається додаток?",
  feedbackPromptTitle: "Чи не могли б ви дати нам зворотний зв'язок?"
}));

Locales.addLocale(new Locale({
  language: 'ur',
  title: "شرح %@",
  message: "اگر آپ نے %@ کا استعمال کرتے ہوئے سے لطف اندوز ہوتے، تو آپ کو ایک درجہ لمحے لینے میں کوئی اعتراض کریں گے؟ یہ ایک منٹ سے زیادہ نہیں لگے گا. آپ کی حمایت کے لئے شکریہ!",
  cancelButtonLabel: "نہیں، شکریہ",
  laterButtonLabel: "مجھے بعد میں یاد دلائیں",
  rateButtonLabel: "شرح اب یہ"
}));

Locales.addLocale(new Locale({
  language: 'ur-IN',
  title: "کو ریٹ کیجیے %@",
  message: "اگر آپ نے %@ کو مفید پایا ہے تو کیا آپ اپنے قیمتی وقت میں سے چند لمحے نکال کر اس کو ریٹ کریں گے؟ اس میں ایک منٹ سے زیادہ نہیں لگے گا، آپ کے تعاون کا شکریہ!",
  cancelButtonLabel: "نہیں، شکریہ",
  laterButtonLabel: "مجھے بعد میں یاد دلائیں",
  rateButtonLabel: "ابھی ریٹ کیجیے"
}));

Locales.addLocale(new Locale({
  language: 'ur-PK',
  title: "کو ریٹ کیجیے %@",
  message: "اگر آپ نے %@ کو مفید پایا ہے تو کیا آپ اپنے قیمتی وقت میں سے چند لمحے نکال کر اس کو ریٹ کریں گے؟ اس میں ایک منٹ سے زیادہ نہیں لگے گا، آپ کے تعاون کا شکریہ!",
  cancelButtonLabel: "نہیں، شکریہ",
  laterButtonLabel: "مجھے بعد میں یاد دلائیں",
  rateButtonLabel: "ابھی ریٹ کیجیے"
}));

Locales.addLocale(new Locale({
  language: 'vi',
  title: "Đánh giá %@",
  message: "Nếu thích sử dụng %@, bạn có muốn giành một chút thời gian để đánh giá nó? Sẽ không lâu hơn một phút. Cảm ơn sự hỗ trợ của bạn!",
  cancelButtonLabel: "Không, Cảm ơn",
  laterButtonLabel: "Nhắc Tôi Sau",
  rateButtonLabel: "Đánh Giá Ngay"
}));

Locales.addLocale(new Locale({
  language: 'zh-TW',
  title: "評分 %@",
  message: "如果你喜歡使用 %@, 是否介意耽誤您一點時間來給我們一個評分呢？ 該動作不會超過一分鐘。 謝謝您的支持！",
  cancelButtonLabel: "不，謝謝",
  laterButtonLabel: "稍後通知我",
  rateButtonLabel: "現在評分"
}));

Locales.addLocale(new Locale({
  language: 'zh-Hans',
  title: "为“%@”评分",
  message: "如果您觉得“%@”很好用，可否为其评一个分数？评分过程只需花费很少的时间。感谢您的支持！",
  cancelButtonLabel: "不了，谢谢",
  laterButtonLabel: "稍后再说",
  rateButtonLabel: "现在去评分"
}));

Locales.addLocale(new Locale({
  language: 'zh-Hant',
  title: "評分 %@",
  message: "如果您喜歡用 %@，是否願意花一些時間打個分數？其過程將不超過一分鐘。 謝謝您的支持！",
  cancelButtonLabel: "不，謝謝",
  laterButtonLabel: "稍後提醒我",
  rateButtonLabel: "現在評分"
}));

module.exports = Locales;
