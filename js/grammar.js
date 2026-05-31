const grammarData = [
  {
    id: "gr001",
    rule: "Артикли «a» и «the»",
    explanation: "В английском языке два артикля: «a/an» используется при первом упоминании предмета или когда он один из многих, а «the» — когда предмет уже известен собеседнику или является единственным в своём роде. В русском языке артиклей нет — это самая частая ошибка.",
    examples: [
      { wrong: "I have dog.", right: "I have a dog.", note: "Первое упоминание — нужен «a»" },
      { wrong: "Dog is in garden.", right: "The dog is in the garden.", note: "Уже известный предмет — «the»" },
      { wrong: "She is teacher.", right: "She is a teacher.", note: "Профессия — нужен «a»" },
      { wrong: "Can you close window?", right: "Can you close the window?", note: "Конкретное окно — «the»" },
      { wrong: "I saw movie yesterday.", right: "I saw a movie yesterday.", note: "Один из многих фильмов — «a»" }
    ],
    quiz: [
      { question: "Выберите правильный вариант: ___ sun rises in the east.", options: ["A", "The", "An", "(без артикля)"], answer: 1 },
      { question: "Выберите правильный вариант: She bought ___ new car.", options: ["the", "a", "an", "(без артикля)"], answer: 1 },
      { question: "Выберите правильный вариант: I need ___ umbrella.", options: ["a", "the", "an", "(без артикля)"], answer: 2 }
    ]
  },
  {
    id: "gr002",
    rule: "Нулевой артикль",
    explanation: "В некоторых случаях артикль не используется вовсе: перед именами собственными, названиями языков, видами спорта, абстрактными понятиями (music, love, life) и в устойчивых выражениях — go to school, go to bed.",
    examples: [
      { wrong: "I like the music.", right: "I like music.", note: "Абстрактное понятие — без артикля" },
      { wrong: "She goes to the school every day.", right: "She goes to school every day.", note: "Устойчивое выражение — без артикля" },
      { wrong: "He speaks the English.", right: "He speaks English.", note: "Названия языков — без артикля" },
      { wrong: "I play the football.", right: "I play football.", note: "Виды спорта — без артикля" },
      { wrong: "The life is beautiful.", right: "Life is beautiful.", note: "Жизнь как абстрактное понятие — без артикля" }
    ],
    quiz: [
      { question: "Выберите правильный вариант: I love ___ Russian food.", options: ["the", "a", "(без артикля)", "an"], answer: 2 },
      { question: "Выберите правильный вариант: He is in ___ bed.", options: ["a", "the", "(без артикля)", "an"], answer: 2 },
      { question: "Выберите правильный вариант: ___ Paris is in France.", options: ["The", "A", "(без артикля)", "An"], answer: 2 }
    ]
  },
  {
    id: "gr003",
    rule: "Present Simple vs Present Continuous",
    explanation: "Present Simple (I go) — для регулярных действий, фактов и расписаний. Present Continuous (I am going) — для действий прямо сейчас или ближайших запланированных действий. Глаголы состояния (know, like, understand) не используются в Continuous.",
    examples: [
      { wrong: "I am going to work every day.", right: "I go to work every day.", note: "Регулярное действие — Simple" },
      { wrong: "She reads a book now.", right: "She is reading a book now.", note: "Действие прямо сейчас — Continuous" },
      { wrong: "Water is boiling at 100°C.", right: "Water boils at 100°C.", note: "Научный факт — Simple" },
      { wrong: "He is always losing his keys.", right: "He always loses his keys.", note: "Привычка с always — Simple" },
      { wrong: "I am understanding this.", right: "I understand this.", note: "Глагол состояния — только Simple" }
    ],
    quiz: [
      { question: "Выберите правильный вариант: Look! It ___ (rain).", options: ["rains", "is raining", "rained", "has rained"], answer: 1 },
      { question: "Выберите правильный вариант: She ___ (work) at a hospital.", options: ["is working", "works", "worked", "has worked"], answer: 1 },
      { question: "Выберите правильный вариант: I ___ (not understand) this.", options: ["am not understanding", "don't understand", "didn't understand", "haven't understood"], answer: 1 }
    ]
  },
  {
    id: "gr004",
    rule: "Past Simple: правильные глаголы (-ed)",
    explanation: "Правильные глаголы образуют прошедшее время добавлением -ed. Произношение окончания зависит от последнего звука: /t/ после глухих согласных (watched), /d/ после звонких (played), /ɪd/ после /t/ и /d/ (wanted, needed).",
    examples: [
      { wrong: "I work yesterday.", right: "I worked yesterday.", note: "worked /wɜːkt/ — после /k/ произносим /t/" },
      { wrong: "She play tennis last week.", right: "She played tennis last week.", note: "played /pleɪd/ — после гласного произносим /d/" },
      { wrong: "We want go home.", right: "We wanted to go home.", note: "wanted /wɒntɪd/ — после /t/ произносим /ɪd/" },
      { wrong: "He walk to school.", right: "He walked to school.", note: "walked /wɔːkt/ — после /k/ произносим /t/" },
      { wrong: "They visit Paris.", right: "They visited Paris.", note: "visited /vɪzɪtɪd/ — после /t/ произносим /ɪd/" }
    ],
    quiz: [
      { question: "Как произносится окончание в слове «watched»?", options: ["/d/", "/t/", "/ɪd/", "/ed/"], answer: 1 },
      { question: "Как произносится окончание в слове «needed»?", options: ["/t/", "/d/", "/ɪd/", "/ed/"], answer: 2 },
      { question: "Как произносится окончание в слове «cleaned»?", options: ["/t/", "/ɪd/", "/d/", "/ed/"], answer: 2 }
    ]
  },
  {
    id: "gr005",
    rule: "Past Simple: неправильные глаголы (топ-10)",
    explanation: "Неправильные глаголы не следуют правилу -ed и образуют прошедшее время особым образом. Для уровня A1-A2 особенно важны десять частых форм: be, was or were; have, had; do, did; go, went; get, got; make, made; take, took; come, came; see, saw; know, knew. После did основной глагол снова стоит в начальной форме.",
    examples: [
      { wrong: "I goed to the store.", right: "I went to the store.", note: "go → went" },
      { wrong: "She maked a cake.", right: "She made a cake.", note: "make → made" },
      { wrong: "He taked a photo.", right: "He took a photo.", note: "take → took" },
      { wrong: "We seed the doctor.", right: "We saw the doctor.", note: "see → saw" },
      { wrong: "They knowed the answer.", right: "They knew the answer.", note: "know → knew" }
    ],
    quiz: [
      { question: "Прошедшее время глагола «have»:", options: ["haved", "had", "has", "have"], answer: 1 },
      { question: "Прошедшее время глагола «come»:", options: ["comed", "came", "come", "comes"], answer: 1 },
      { question: "Прошедшее время глагола «see»:", options: ["seed", "sawed", "saw", "seen"], answer: 2 }
    ]
  },
  {
    id: "gr006",
    rule: "Порядок слов (Subject-Verb-Object)",
    explanation: "В английском языке строгий порядок слов: Подлежащее → Сказуемое → Дополнение. В отличие от русского, его нельзя менять произвольно. Наречия частотности (always, often, never) стоят между подлежащим и глаголом, наречия времени и места — в конце.",
    examples: [
      { wrong: "Always she comes late.", right: "She always comes late.", note: "Наречия частотности — между подлежащим и глаголом" },
      { wrong: "He plays well tennis.", right: "He plays tennis well.", note: "Наречие образа действия — после дополнения" },
      { wrong: "I very much like this film.", right: "I like this film very much.", note: "Very much — в конец предложения" },
      { wrong: "Yesterday I saw him.", right: "I saw him yesterday.", note: "Обстоятельство времени обычно в конец" },
      { wrong: "The book I read yesterday.", right: "I read the book yesterday.", note: "Подлежащее (I) — всегда на первом месте" }
    ],
    quiz: [
      { question: "Выберите правильный порядок слов:", options: ["Every day I coffee drink.", "I drink coffee every day.", "Coffee I drink every day.", "Every day coffee I drink."], answer: 1 },
      { question: "Где стоит «always» в предложении?", options: ["В начале", "После подлежащего, перед глаголом", "В конце", "Перед подлежащим"], answer: 1 },
      { question: "Выберите правильный вариант:", options: ["She speaks well Russian.", "Well she speaks Russian.", "She speaks Russian well.", "Russian she speaks well."], answer: 2 }
    ]
  },
  {
    id: "gr007",
    rule: "Образование вопросов",
    explanation: "В английском вопросе используются вспомогательные глаголы: do/does (Present Simple), did (Past Simple), am/is/are (Present Continuous). Вспомогательный глагол ставится перед подлежащим. После «did» основной глагол стоит в инфинитиве.",
    examples: [
      { wrong: "You like coffee?", right: "Do you like coffee?", note: "Present Simple — нужен «do»" },
      { wrong: "She works here?", right: "Does she work here?", note: "3-е лицо ед.ч. — «does», глагол без -s" },
      { wrong: "You went to school yesterday?", right: "Did you go to school yesterday?", note: "Past Simple — «did», глагол без -ed" },
      { wrong: "What you are doing?", right: "What are you doing?", note: "Вспомогательный глагол перед подлежащим" },
      { wrong: "Where lives your friend?", right: "Where does your friend live?", note: "Present Simple — нужен «does»" }
    ],
    quiz: [
      { question: "Как правильно задать вопрос в Present Simple?", options: ["You speak English?", "Do you speak English?", "Are you speak English?", "Does you speaks English?"], answer: 1 },
      { question: "Выберите правильный вопрос в Past Simple:", options: ["Did he went?", "Did he go?", "Does he went?", "He went?"], answer: 1 },
      { question: "Выберите правильный вопрос:", options: ["What she is doing?", "What is she doing?", "What does she is doing?", "What she does?"], answer: 1 }
    ]
  },
  {
    id: "gr008",
    rule: "Отрицание",
    explanation: "Для образования отрицания используются: don't/doesn't (Present Simple), didn't (Past Simple), isn't/aren't (Present Continuous). После didn't/doesn't глагол стоит в инфинитиве. Двойное отрицание в английском языке недопустимо.",
    examples: [
      { wrong: "I not like coffee.", right: "I don't like coffee.", note: "Present Simple — нужен «don't»" },
      { wrong: "She not works here.", right: "She doesn't work here.", note: "3-е лицо ед.ч. — «doesn't», глагол без -s" },
      { wrong: "He didn't went.", right: "He didn't go.", note: "После «didn't» — инфинитив без -ed" },
      { wrong: "I don't know nothing.", right: "I don't know anything.", note: "Двойное отрицание запрещено" },
      { wrong: "They aren't no students.", right: "They aren't students.", note: "«aren't» уже отрицание — «no» не нужно" }
    ],
    quiz: [
      { question: "Выберите правильное отрицание:", options: ["She not likes it.", "She doesn't likes it.", "She doesn't like it.", "She isn't like it."], answer: 2 },
      { question: "Выберите правильное отрицание в Past Simple:", options: ["I didn't went.", "I not went.", "I didn't go.", "I don't went."], answer: 2 },
      { question: "Какое предложение правильное?", options: ["I don't know nothing.", "I know nothing.", "I don't know anything.", "Варианты B и C"], answer: 3 }
    ]
  },
  {
    id: "gr009",
    rule: "Предлоги места: in / on / at",
    explanation: "«In» — внутри ограниченного пространства (комната, город, страна). «On» — на поверхности (стол, стена, пол). «At» — в конкретной точке или месте (адрес, учреждение, остановка). В русском эти значения передаются падежными окончаниями.",
    examples: [
      { wrong: "She is at the kitchen.", right: "She is in the kitchen.", note: "Внутри комнаты — «in»" },
      { wrong: "The book is in the table.", right: "The book is on the table.", note: "На поверхности — «on»" },
      { wrong: "I am in the bus stop.", right: "I am at the bus stop.", note: "Конкретная точка — «at»" },
      { wrong: "He lives on Moscow.", right: "He lives in Moscow.", note: "Города и страны — «in»" },
      { wrong: "There's a picture in the wall.", right: "There's a picture on the wall.", note: "На стене (поверхность) — «on»" }
    ],
    quiz: [
      { question: "Выберите правильный предлог: She works ___ a hospital.", options: ["in", "on", "at", "by"], answer: 2 },
      { question: "Выберите правильный предлог: The cat is ___ the box.", options: ["on", "at", "in", "by"], answer: 2 },
      { question: "Выберите правильный предлог: I saw it ___ the newspaper.", options: ["at", "on", "in", "by"], answer: 2 }
    ]
  },
  {
    id: "gr010",
    rule: "Предлоги времени: in / on / at",
    explanation: "«At» — точное время и устойчивые выражения (at 5 o'clock, at night, at noon). «On» — дни недели и даты (on Monday, on March 5th). «In» — месяцы, годы, сезоны и части суток (in January, in 2020, in the morning).",
    examples: [
      { wrong: "I wake up in 7 o'clock.", right: "I wake up at 7 o'clock.", note: "Точное время — «at»" },
      { wrong: "She was born in Monday.", right: "She was born on Monday.", note: "День недели — «on»" },
      { wrong: "We met on 2019.", right: "We met in 2019.", note: "Год — «in»" },
      { wrong: "The party is at Friday evening.", right: "The party is on Friday evening.", note: "Конкретный день — «on»" },
      { wrong: "I love walking on the morning.", right: "I love walking in the morning.", note: "Части суток — «in» (кроме night)" }
    ],
    quiz: [
      { question: "Выберите правильный предлог: I will call you ___ Monday.", options: ["in", "at", "on", "by"], answer: 2 },
      { question: "Выберите правильный предлог: He was born ___ 1995.", options: ["on", "at", "in", "by"], answer: 2 },
      { question: "Выберите правильный предлог: The film starts ___ 8 pm.", options: ["in", "on", "at", "by"], answer: 2 }
    ]
  },
  {
    id: "gr011",
    rule: "Притяжательные местоимения и апостроф",
    explanation: "Притяжательные местоимения (my, your, his, her, its, our, their) не изменяются по родам. Для существительных используется апостроф: John's book (один владелец), the students' books (несколько). Важно: its = его, it's = it is/it has.",
    examples: [
      { wrong: "This is the book of John.", right: "This is John's book.", note: "Принадлежность одному лицу: апостроф + s" },
      { wrong: "The dog wagged it's tail.", right: "The dog wagged its tail.", note: "its = его (притяжательное), it's = it is" },
      { wrong: "The students homeworks are done.", right: "The students' homework is done.", note: "Много владельцев: s' (и homework несчисляемое)" },
      { wrong: "Is this your's book?", right: "Is this your book?", note: "«your» уже притяжательное — апостроф не нужен" },
      { wrong: "She forgot her's keys.", right: "She forgot her keys.", note: "«her» уже притяжательное — без апострофа" }
    ],
    quiz: [
      { question: "Как правильно сказать «книга Марии»?", options: ["the book of Maria", "Maria's book", "Marias book", "the Maria book"], answer: 1 },
      { question: "Что значит «it's»?", options: ["Его (притяжательное)", "it is / it has", "Их", "Это (указательное)"], answer: 1 },
      { question: "Выберите правильный вариант:", options: ["This is her's car.", "This is hers car.", "This is her car.", "This is she's car."], answer: 2 }
    ]
  },
  {
    id: "gr012",
    rule: "Исчисляемые и неисчисляемые существительные",
    explanation: "Исчисляемые существительные можно посчитать (a book, two books). Неисчисляемые нельзя (water, music, advice, information, homework, furniture) — перед ними нельзя ставить «a/an» и нельзя прибавлять -s. Вместо этого используют some, much, a little, a piece of.",
    examples: [
      { wrong: "I'd like a water, please.", right: "I'd like some water, please.", note: "water — неисчисляемое, нельзя «a»" },
      { wrong: "Can you give me an advice?", right: "Can you give me some advice?", note: "advice — всегда неисчисляемое" },
      { wrong: "I have many homeworks.", right: "I have a lot of homework.", note: "homework — неисчисляемое, без -s" },
      { wrong: "She bought three furnitures.", right: "She bought three pieces of furniture.", note: "furniture — неисчисляемое" },
      { wrong: "I need an information.", right: "I need some information.", note: "information — неисчисляемое" }
    ],
    quiz: [
      { question: "Какое слово является неисчисляемым?", options: ["chair", "table", "luggage", "book"], answer: 2 },
      { question: "Выберите правильный вариант:", options: ["I need an advice.", "I need advice.", "I need advices.", "I need a advice."], answer: 1 },
      { question: "Выберите правильный вариант:", options: ["much money", "many money", "a money", "moneys"], answer: 0 }
    ]
  },
  {
    id: "gr013",
    rule: "Сравнительная и превосходная степень",
    explanation: "Короткие прилагательные (1 слог): -er/-est (tall → taller → tallest). Длинные (3+ слога): more/most (beautiful → more beautiful → most beautiful). Исключения: good→better→best, bad→worse→worst, far→farther→farthest. Нельзя смешивать: more taller — ошибка.",
    examples: [
      { wrong: "She is more tall than me.", right: "She is taller than me.", note: "Короткое прил. — суффикс -er, не more" },
      { wrong: "This is the most cheap option.", right: "This is the cheapest option.", note: "Короткое прил. — суффикс -est, не most" },
      { wrong: "He is more good at math.", right: "He is better at math.", note: "good → better (исключение)" },
      { wrong: "It's the most bad film ever.", right: "It's the worst film ever.", note: "bad → worst (исключение)" },
      { wrong: "She is more prettier.", right: "She is prettier.", note: "Нельзя сочетать -er и more" }
    ],
    quiz: [
      { question: "Сравнительная степень от «good»:", options: ["gooder", "more good", "better", "best"], answer: 2 },
      { question: "Выберите правильный вариант для «interesting»:", options: ["interestinger", "more interesting", "interestingest", "most interestinger"], answer: 1 },
      { question: "Превосходная степень от «bad»:", options: ["baddest", "most bad", "worst", "more bad"], answer: 2 }
    ]
  },
  {
    id: "gr014",
    rule: "Модальные глаголы",
    explanation: "Модальные глаголы (can, could, must, should, would, may, might) не изменяются по лицам и числам и не получают -s. После них ставится инфинитив без «to». В вопросах и отрицаниях вспомогательный «do» не нужен.",
    examples: [
      { wrong: "She cans swim.", right: "She can swim.", note: "Модальные не получают -s" },
      { wrong: "You must to leave now.", right: "You must leave now.", note: "После модального — инфинитив без «to»" },
      { wrong: "Do you can help me?", right: "Can you help me?", note: "Вопрос с модальным — без «do»" },
      { wrong: "He doesn't can drive.", right: "He can't drive.", note: "Отрицание — непосредственно к модальному" },
      { wrong: "Would you to like some tea?", right: "Would you like some tea?", note: "would like — без «to»" }
    ],
    quiz: [
      { question: "Выберите правильный вариант:", options: ["She musts go.", "She must to go.", "She must go.", "She does must go."], answer: 2 },
      { question: "Как правильно задать вопрос с «can»?", options: ["Do you can swim?", "Can you swim?", "You can swim?", "Are you can swim?"], answer: 1 },
      { question: "Выберите правильное отрицание:", options: ["He doesn't should.", "He shoulds not.", "He shouldn't.", "He not should."], answer: 2 }
    ]
  },
  {
    id: "gr015",
    rule: "Present Perfect vs Past Simple",
    explanation: "Present Perfect (have/has + V3) связывает прошлое с настоящим: жизненный опыт, результат или незавершённое действие (I have been to London — был, и это важно сейчас). Past Simple — конкретный момент в прошлом (I was in London in 2019). В русском языке это различие отсутствует.",
    examples: [
      { wrong: "I have seen him yesterday.", right: "I saw him yesterday.", note: "Конкретное время (yesterday) → Past Simple" },
      { wrong: "Did you ever visit Paris?", right: "Have you ever visited Paris?", note: "Жизненный опыт (ever) → Present Perfect" },
      { wrong: "She has lived here in 2010.", right: "She lived here in 2010.", note: "Конкретный год → Past Simple" },
      { wrong: "I just finished the book.", right: "I have just finished the book.", note: "just — сигнал Present Perfect" },
      { wrong: "He has went to work.", right: "He has gone to work.", note: "Present Perfect + правильная форма V3" }
    ],
    quiz: [
      { question: "Выберите правильный вариант: I ___ in Moscow for 5 years (и сейчас живу).", options: ["lived", "have lived", "was living", "did live"], answer: 1 },
      { question: "Выберите правильный вариант: She ___ the film last night.", options: ["has watched", "watched", "have watched", "has watch"], answer: 1 },
      { question: "Что означает «I have never tried sushi»?", options: ["Я попробовал суши", "Я никогда не пробовал суши", "Я попробую суши", "Мне не нравится суши"], answer: 1 }
    ]
  },
  {
    id: "gr016",
    rule: "Will vs going to",
    explanation: "Will часто используется для решения в момент речи, обещания или общего прогноза без явного плана. Going to используется, когда план уже есть или когда результат виден по текущим признакам. В русской речи оба варианта часто переводятся будущим временем, поэтому важно смотреть на ситуацию.",
    examples: [
      { wrong: "Look at the clouds. It will rain.", right: "Look at the clouds. It is going to rain.", note: "Есть видимый признак, поэтому лучше going to" },
      { wrong: "I am going to help you, I promise.", right: "I will help you, I promise.", note: "Обещание обычно выражается через will" },
      { wrong: "Wait, I am going to open the door.", right: "Wait, I will open the door.", note: "Решение принято сейчас, поэтому will" },
      { wrong: "We will visit Anna on Saturday. We bought tickets.", right: "We are going to visit Anna on Saturday. We bought tickets.", note: "План уже есть, поэтому going to" },
      { wrong: "She will have a baby soon. The doctor told her.", right: "She is going to have a baby soon. The doctor told her.", note: "Есть подтверждённая ситуация, поэтому going to" }
    ],
    quiz: [
      { question: "Выберите вариант: I forgot my wallet. I ___ pay by card.", options: ["am going to", "will", "did", "am"], answer: 1 },
      { question: "Выберите вариант: They bought paint. They ___ paint the room.", options: ["will", "are going to", "do", "did"], answer: 1 },
      { question: "Выберите вариант: Look, the glass is falling. It ___ break.", options: ["will", "is going to", "does", "did"], answer: 1 }
    ]
  },
  {
    id: "gr017",
    rule: "Plural nouns: regular and top-5 irregular",
    explanation: "Обычно множественное число существительных образуется с помощью окончания -s или -es: book, books; box, boxes. Некоторые частые слова меняют форму полностью, и их нужно выучить: man, men; woman, women; child, children; person, people; tooth, teeth. После чисел и слов many, few, several обычно нужна форма множественного числа.",
    examples: [
      { wrong: "I have two book.", right: "I have two books.", note: "После two нужна форма множественного числа" },
      { wrong: "There are three box on the table.", right: "There are three boxes on the table.", note: "После x добавляем -es" },
      { wrong: "She has two childs.", right: "She has two children.", note: "child имеет неправильную форму children" },
      { wrong: "Many person live here.", right: "Many people live here.", note: "person во множественном числе часто people" },
      { wrong: "My tooths hurt.", right: "My teeth hurt.", note: "tooth имеет неправильную форму teeth" }
    ],
    quiz: [
      { question: "Множественное число от child:", options: ["childs", "children", "childes", "childrens"], answer: 1 },
      { question: "Выберите правильный вариант:", options: ["three box", "three boxs", "three boxes", "three boxed"], answer: 2 },
      { question: "Множественное число от woman:", options: ["womans", "women", "womanes", "womens"], answer: 1 }
    ]
  },
  {
    id: "gr018",
    rule: "Prepositions of place: in, on, at, under, next to",
    explanation: "In означает внутри пространства, on означает на поверхности, at указывает на точку или учреждение. Under означает под предметом, а next to означает рядом с предметом или человеком. В английском предлог нельзя пропускать, даже если в русском смысл понятен из падежа.",
    examples: [
      { wrong: "The keys are in the table.", right: "The keys are on the table.", note: "Ключи лежат на поверхности, нужен on" },
      { wrong: "She is on the room.", right: "She is in the room.", note: "Комната как пространство, нужен in" },
      { wrong: "I am in the bus stop.", right: "I am at the bus stop.", note: "Остановка как точка, нужен at" },
      { wrong: "The bag is next the chair.", right: "The bag is next to the chair.", note: "Правильная форма: next to" },
      { wrong: "The shoes are on the bed.", right: "The shoes are under the bed.", note: "Если предмет ниже кровати, нужен under" }
    ],
    quiz: [
      { question: "Выберите предлог: The phone is ___ my bag.", options: ["on", "in", "at", "under"], answer: 1 },
      { question: "Выберите предлог: The picture is ___ the wall.", options: ["in", "on", "at", "next"], answer: 1 },
      { question: "Выберите предлог: The cafe is ___ the bank.", options: ["next to", "under to", "in to", "on to"], answer: 0 }
    ]
  },
  {
    id: "gr019",
    rule: "Modals can, must, should",
    explanation: "Can выражает умение или возможность, must выражает строгую необходимость, should выражает совет. После can, must и should используется основной глагол без to, и в третьем лице не добавляется -s. В вопросах модальный глагол ставится перед подлежащим.",
    examples: [
      { wrong: "She can to swim.", right: "She can swim.", note: "После can не ставим to" },
      { wrong: "He musts go now.", right: "He must go now.", note: "Модальные глаголы не получают -s" },
      { wrong: "You should to rest.", right: "You should rest.", note: "После should нужен глагол без to" },
      { wrong: "Do you can help me?", right: "Can you help me?", note: "Вопрос строится без do" },
      { wrong: "They do not must wait.", right: "They must not wait.", note: "Отрицание ставится после модального глагола" }
    ],
    quiz: [
      { question: "Выберите правильный вариант:", options: ["She cans drive.", "She can drive.", "She can to drive.", "She does can drive."], answer: 1 },
      { question: "Что лучше для совета?", options: ["can", "must", "should", "did"], answer: 2 },
      { question: "Выберите правильный вопрос:", options: ["Do you can come?", "Can you come?", "You can come?", "Are you can come?"], answer: 1 }
    ]
  },
  {
    id: "gr020",
    rule: "Question word order with Do, Does, Did",
    explanation: "В Present Simple вопросы строятся через do или does: do для I, you, we, they; does для he, she, it. В Past Simple используется did для всех лиц, а основной глагол возвращается в начальную форму. Если есть вопросительное слово, порядок такой: вопросительное слово, вспомогательный глагол, подлежащее, основной глагол.",
    examples: [
      { wrong: "You like coffee?", right: "Do you like coffee?", note: "В Present Simple нужен do" },
      { wrong: "Where she works?", right: "Where does she work?", note: "С he, she, it нужен does, а глагол без -s" },
      { wrong: "Did you went home?", right: "Did you go home?", note: "После did нужен инфинитив без прошедшей формы" },
      { wrong: "What does he likes?", right: "What does he like?", note: "После does глагол без -s" },
      { wrong: "When they did arrive?", right: "When did they arrive?", note: "После вопросительного слова ставим did, затем подлежащее" }
    ],
    quiz: [
      { question: "Выберите правильный вопрос:", options: ["Do you work here?", "You work here?", "Does you work here?", "Did you works here?"], answer: 0 },
      { question: "Выберите правильный вопрос:", options: ["Where she lives?", "Where does she live?", "Where does she lives?", "Where do she live?"], answer: 1 },
      { question: "Выберите Past Simple вопрос:", options: ["Did they went?", "Do they went?", "Did they go?", "Does they go?"], answer: 2 }
    ]
  }
];
