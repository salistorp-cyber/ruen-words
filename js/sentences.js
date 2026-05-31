const SENTENCES = [
  // Verbs (existing)
  { id: "sn001", ru: "Я иду домой.",               en: "I am going home.",              category: "verbs" },
  { id: "sn005", ru: "Я знаю это слово.",            en: "I know this word.",            category: "verbs" },
  { id: "sn008", ru: "Она читает книгу.",            en: "She is reading a book.",        category: "verbs" },
  { id: "sn013", ru: "Она говорит по-английски.",    en: "She speaks English.",           category: "verbs" },
  { id: "sn017", ru: "Я не понимаю вопрос.",         en: "I don't understand the question.", category: "verbs" },

  // Food (existing)
  { id: "sn002", ru: "Он пьёт чай.",                en: "He is drinking tea.",           category: "food" },
  { id: "sn006", ru: "Дети едят хлеб.",              en: "The children are eating bread.", category: "food" },
  { id: "sn010", ru: "Я хочу кофе.",                en: "I want coffee.",                category: "food" },
  { id: "sn018", ru: "Чай горячий и вкусный.",       en: "The tea is hot and tasty.",     category: "food" },

  // Family (existing)
  { id: "sn003", ru: "Мама готовит суп.",            en: "Mom is cooking soup.",          category: "family" },
  { id: "sn007", ru: "Брат работает в банке.",       en: "My brother works at the bank.", category: "family" },
  { id: "sn011", ru: "Папа едет на работу.",         en: "Dad is going to work.",         category: "family" },
  { id: "sn015", ru: "Дедушка любит рыбу.",          en: "Grandfather likes fish.",       category: "family" },
  { id: "sn019", ru: "Сестра покупает молоко.",      en: "My sister is buying milk.",     category: "family" },

  // Places (existing)
  { id: "sn004", ru: "Магазин большой.",             en: "The shop is big.",             category: "places" },
  { id: "sn009", ru: "Город очень красивый.",        en: "The city is very beautiful.",   category: "places" },
  { id: "sn012", ru: "Это дорогой ресторан.",        en: "This is an expensive restaurant.", category: "places" },
  { id: "sn014", ru: "Мы живём в городе.",           en: "We live in the city.",          category: "places" },
  { id: "sn016", ru: "Школа находится здесь.",       en: "The school is here.",           category: "places" },

  // Greetings (existing)
  { id: "sn020", ru: "Добрый день! Как дела?",       en: "Good afternoon! How are you?",  category: "greetings" },

  // Colors
  { id: "sn021", ru: "Её платье красного цвета.",    en: "Her dress is red.",             category: "colors" },
  { id: "sn022", ru: "Небо синее и чистое.",         en: "The sky is blue and clear.",    category: "colors" },
  { id: "sn023", ru: "Трава зелёная весной.",        en: "The grass is green in spring.", category: "colors" },
  { id: "sn024", ru: "У него чёрная куртка.",        en: "He has a black jacket.",        category: "colors" },
  { id: "sn025", ru: "Снег белый и холодный.",       en: "Snow is white and cold.",       category: "colors" },

  // Body
  { id: "sn026", ru: "У меня болит голова.",         en: "I have a headache.",            category: "body" },
  { id: "sn027", ru: "У неё голубые глаза.",         en: "She has blue eyes.",            category: "body" },
  { id: "sn028", ru: "У меня болит зуб.",            en: "I have a toothache.",           category: "body" },
  { id: "sn029", ru: "Умой руки перед едой.",        en: "Wash your hands before eating.", category: "body" },
  { id: "sn030", ru: "У неё длинные волосы.",        en: "She has long hair.",            category: "body" },

  // Clothing
  { id: "sn031", ru: "Надень пальто, на улице холодно.", en: "Put on your coat, it is cold outside.", category: "clothing" },
  { id: "sn032", ru: "Где моя шапка?",              en: "Where is my hat?",              category: "clothing" },
  { id: "sn033", ru: "Она купила красивое платье.",  en: "She bought a beautiful dress.", category: "clothing" },
  { id: "sn034", ru: "Он надел костюм на собеседование.", en: "He wore a suit to the interview.", category: "clothing" },
  { id: "sn035", ru: "Зимой нужны перчатки и шарф.", en: "You need gloves and a scarf in winter.", category: "clothing" },

  // Transport
  { id: "sn036", ru: "Автобус приходит каждые десять минут.", en: "The bus comes every ten minutes.", category: "transport" },
  { id: "sn037", ru: "Я еду на работу на метро.",   en: "I go to work by metro.",        category: "transport" },
  { id: "sn038", ru: "Мы летим в Москву завтра.",   en: "We are flying to Moscow tomorrow.", category: "transport" },
  { id: "sn039", ru: "Вызови такси, пожалуйста.",   en: "Please call a taxi.",           category: "transport" },
  { id: "sn040", ru: "Я купил билет на поезд.",     en: "I bought a train ticket.",      category: "transport" },

  // Time
  { id: "sn041", ru: "Сегодня хорошая погода.",     en: "The weather is good today.",    category: "time" },
  { id: "sn042", ru: "Завтра у меня экзамен.",      en: "I have an exam tomorrow.",      category: "time" },
  { id: "sn043", ru: "Вчера мы ходили в ресторан.", en: "Yesterday we went to a restaurant.", category: "time" },
  { id: "sn044", ru: "Я встаю рано утром.",         en: "I wake up early in the morning.", category: "time" },
  { id: "sn045", ru: "Вечером мы смотрим телевизор.", en: "In the evening we watch TV.", category: "time" },
  { id: "sn046", ru: "Поговорим об этом потом.",    en: "Let's talk about this later.",  category: "time" },

  // Weather
  { id: "sn047", ru: "Сегодня светит солнце.",      en: "The sun is shining today.",     category: "weather" },
  { id: "sn048", ru: "Идёт дождь, возьми зонт.",    en: "It is raining, take an umbrella.", category: "weather" },
  { id: "sn049", ru: "Зимой идёт снег.",            en: "It snows in winter.",           category: "weather" },
  { id: "sn050", ru: "Сегодня очень холодно.",      en: "It is very cold today.",        category: "weather" },
  { id: "sn051", ru: "Завтра будет гроза.",         en: "There will be a storm tomorrow.", category: "weather" },

  // Emotions
  { id: "sn052", ru: "Она очень счастливая сегодня.", en: "She is very happy today.",    category: "emotions" },
  { id: "sn053", ru: "Почему ты грустный?",         en: "Why are you sad?",              category: "emotions" },
  { id: "sn054", ru: "Я очень устал после работы.", en: "I am very tired after work.",   category: "emotions" },
  { id: "sn055", ru: "Он нервный перед экзаменом.", en: "He is nervous before the exam.", category: "emotions" },
  { id: "sn056", ru: "Мама гордая своим сыном.",    en: "Mom is proud of her son.",      category: "emotions" },

  // Work
  { id: "sn057", ru: "Встреча начинается в десять.", en: "The meeting starts at ten.",   category: "work" },
  { id: "sn058", ru: "Я работаю в офисе.",          en: "I work in an office.",          category: "work" },
  { id: "sn059", ru: "Дедлайн — в пятницу.",        en: "The deadline is on Friday.",    category: "work" },
  { id: "sn060", ru: "Завтра у меня собеседование.", en: "I have an interview tomorrow.", category: "work" },
  { id: "sn061", ru: "Мой коллега очень умный.",    en: "My colleague is very smart.",   category: "work" },
  { id: "sn062", ru: "Я подписал контракт.",        en: "I signed the contract.",        category: "work" },

  // Health
  { id: "sn063", ru: "Мне нужен врач.",             en: "I need a doctor.",              category: "health" },
  { id: "sn064", ru: "Принимайте лекарство три раза в день.", en: "Take the medicine three times a day.", category: "health" },
  { id: "sn065", ru: "У него высокая температура.", en: "He has a high fever.",          category: "health" },
  { id: "sn066", ru: "Аптека рядом с больницей.",   en: "The pharmacy is near the hospital.", category: "health" },
  { id: "sn067", ru: "Хороший сон важен для здоровья.", en: "Good sleep is important for health.", category: "health" },

  // Education
  { id: "sn068", ru: "Я учусь в университете.",     en: "I study at the university.",    category: "education" },
  { id: "sn069", ru: "Учитель объясняет урок.",     en: "The teacher explains the lesson.", category: "education" },
  { id: "sn070", ru: "Я сделал домашнее задание.",  en: "I did my homework.",            category: "education" },
  { id: "sn071", ru: "Он получил хорошую оценку.",  en: "He got a good grade.",          category: "education" },
  { id: "sn072", ru: "Я изучаю русский язык.",      en: "I am learning Russian.",        category: "education" },
  { id: "sn073", ru: "Она окончила университет.",   en: "She graduated from university.", category: "education" },

  // Shopping
  { id: "sn074", ru: "Сколько стоит этот товар?",   en: "How much does this item cost?", category: "shopping" },
  { id: "sn075", ru: "Можно платить картой?",        en: "Can I pay by card?",            category: "shopping" },
  { id: "sn076", ru: "Дайте мне чек, пожалуйста.",  en: "Please give me the receipt.",   category: "shopping" },
  { id: "sn077", ru: "На этот товар скидка.",        en: "There is a discount on this item.", category: "shopping" },
  { id: "sn078", ru: "Какой у вас размер?",          en: "What is your size?",            category: "shopping" },

  // Home
  { id: "sn079", ru: "Книга лежит на столе.",       en: "The book is on the table.",     category: "home" },
  { id: "sn080", ru: "Открой окно, здесь жарко.",   en: "Open the window, it is hot here.", category: "home" },
  { id: "sn081", ru: "Кошка спит на диване.",       en: "The cat is sleeping on the sofa.", category: "home" },
  { id: "sn082", ru: "На стене висит картина.",     en: "A picture hangs on the wall.",  category: "home" },
  { id: "sn083", ru: "Я потерял ключ от дома.",     en: "I lost the house key.",         category: "home" },
  { id: "sn084", ru: "Бабушка работает в саду.",    en: "Grandmother is working in the garden.", category: "home" },

  // Nature
  { id: "sn085", ru: "В парке много деревьев.",     en: "There are many trees in the park.", category: "nature" },
  { id: "sn086", ru: "Птица сидит на дереве.",      en: "The bird is sitting on the tree.", category: "nature" },
  { id: "sn087", ru: "Летом мы едем на море.",      en: "In summer we go to the sea.",   category: "nature" },
  { id: "sn088", ru: "Собака бежит в парке.",       en: "The dog is running in the park.", category: "nature" },
  { id: "sn089", ru: "Небо сегодня голубое.",       en: "The sky is blue today.",         category: "nature" },

  // Travel phrases
  { id: "sn090", ru: "Извините, где туалет?",       en: "Excuse me, where is the bathroom?", category: "travel phrases" },
  { id: "sn091", ru: "Помогите мне, я заблудился.", en: "Help me, I am lost.",           category: "travel phrases" },
  { id: "sn092", ru: "Поверните направо у банка.",  en: "Turn right at the bank.",       category: "travel phrases" },
  { id: "sn093", ru: "Как далеко это отсюда?",      en: "How far is it from here?",      category: "travel phrases" },

  // Social phrases
  { id: "sn094", ru: "Приятно познакомиться!",      en: "Nice to meet you!",             category: "social phrases" },
  { id: "sn095", ru: "Откуда вы? Я из России.",     en: "Where are you from? I am from Russia.", category: "social phrases" },
  { id: "sn096", ru: "С днём рождения! Желаю счастья.", en: "Happy birthday! I wish you happiness.", category: "social phrases" },
  { id: "sn097", ru: "Большое спасибо за помощь!",  en: "Thank you very much for your help!", category: "social phrases" },

  // Verbs 2
  { id: "sn098", ru: "Дай мне книгу, пожалуйста.",  en: "Give me the book, please.",     category: "verbs2" },
  { id: "sn099", ru: "Закрой дверь, там холодно.",  en: "Close the door, it is cold there.", category: "verbs2" },
  { id: "sn100", ru: "Позвони мне вечером.",         en: "Call me in the evening.",       category: "verbs2" },

  // Present Simple practice
  { id: "sn101", ru: "Я работаю в офисе каждый день.", en: "I work in an office every day.", category: "present simple" },
  { id: "sn102", ru: "Она обычно пьёт чай утром.", en: "She usually drinks tea in the morning.", category: "present simple" },
  { id: "sn103", ru: "Мы живём рядом со школой.", en: "We live near the school.", category: "present simple" },
  { id: "sn104", ru: "Он не любит холодную погоду.", en: "He does not like cold weather.", category: "negation" },

  // Present Continuous practice
  { id: "sn105", ru: "Я сейчас читаю короткий текст.", en: "I am reading a short text now.", category: "present continuous" },
  { id: "sn106", ru: "Они готовят ужин на кухне.", en: "They are cooking dinner in the kitchen.", category: "present continuous" },
  { id: "sn107", ru: "Она не смотрит телевизор сейчас.", en: "She is not watching TV now.", category: "negation" },
  { id: "sn108", ru: "Ты сейчас слушаешь музыку?", en: "Are you listening to music now?", category: "questions" },

  // Past Simple practice
  { id: "sn109", ru: "Вчера я закончил домашнее задание.", en: "Yesterday I finished my homework.", category: "past simple" },
  { id: "sn110", ru: "Мы пошли в магазин утром.", en: "We went to the store in the morning.", category: "past simple" },
  { id: "sn111", ru: "Она купила новое пальто.", en: "She bought a new coat.", category: "past simple" },
  { id: "sn112", ru: "Он не пришёл на урок.", en: "He did not come to the lesson.", category: "negation" },

  // Questions and negation
  { id: "sn113", ru: "Ты говоришь по-английски?", en: "Do you speak English?", category: "questions" },
  { id: "sn114", ru: "Она работает сегодня?", en: "Does she work today?", category: "questions" },
  { id: "sn115", ru: "Куда они пошли вчера?", en: "Where did they go yesterday?", category: "questions" },
  { id: "sn116", ru: "Почему ты опоздал?", en: "Why were you late?", category: "questions" },

  // Future and modal practice
  { id: "sn117", ru: "Завтра я позвоню врачу.", en: "Tomorrow I will call the doctor.", category: "future" },
  { id: "sn118", ru: "Мы собираемся учить новые слова.", en: "We are going to learn new words.", category: "future" },
  { id: "sn119", ru: "Ты можешь открыть окно?", en: "Can you open the window?", category: "modals" },
  { id: "sn120", ru: "Тебе следует лечь спать рано.", en: "You should go to bed early.", category: "modals" },
];
