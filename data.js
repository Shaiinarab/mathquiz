// مدل دانشی داده‌محور: حرفه‌ها -> حوزه‌ها -> درخت موضوعی -> سؤال‌ها.
// هر سؤال: { id, topic, difficulty (1-5), prompt, choices, answer, concept }
// تقسیم و حل روی گره‌های موضوعی انجام می‌شود؛ سختی درون گره توانایی را دقیق‌تر می‌کند.

const QUIZ_DATA = {
  professions: [
    { id: "student", label: "دانشجو", domains: ["math", "cs"] },
    { id: "engineer", label: "مهندس", domains: ["math", "cs"] },
    { id: "researcher", label: "پژوهشگر", domains: ["math"] },
    { id: "custom", label: "سفارشی / عمومی", domains: ["math", "cs"] }
  ],
  domains: {
    math: {
      label: "ریاضیات",
      description: "کاوش در جبر، حسابان، جبر خطی و احتمال؛ سپس باریک‌سازی بر اساس درستی و سختی.",
      // درخت موضوعی برای شاخه‌بندی تقسیم و حل
      tree: [
        { id: "algebra", label: "جبر", children: ["equations", "functions"] },
        { id: "calculus", label: "حسابان", children: ["limits", "derivatives", "integrals"] },
        { id: "linalg", label: "جبر خطی", children: ["vectors", "matrices"] },
        { id: "prob", label: "احتمال و آمار", children: ["probability", "statistics"] }
      ],
      questions: [
        { id:"m1", topic:"matrices", parent:"linalg", difficulty:3, prompt:"دترمینان ماتریس [[1,2],[3,4]] کدام است؟", choices:["-2","2","10","-10"], answer:0, concept:"دترمینان ۲×۲ (ad-bc)" },
        { id:"m2", topic:"integrals", parent:"calculus", difficulty:3, prompt:"حاصل ∫ 2x dx برابر است با:", choices:["x^2 + C","2x^2 + C","x + C","2 + C"], answer:0, concept:"قاعده توان در انتگرال" },
        { id:"m3", topic:"matrices", parent:"linalg", difficulty:2, prompt:"اگر A یک ماتریس ۲×۳ و B یک ماتریس ۳×۴ باشد، اندازه AB چیست؟", choices:["2x4","3x3","2x3","4x2"], answer:0, concept:"ابعاد ضرب ماتریسی" },
        { id:"m4", topic:"matrices", parent:"linalg", difficulty:4, prompt:"یک ماتریس مربعی وارون‌پذیر است اگر و تنها اگر دترمینان آن:", choices:["ناصفر باشد","صفر باشد","یک باشد","منفی باشد"], answer:0, concept:"شرط وارون‌پذیری" },
        { id:"m5", topic:"integrals", parent:"calculus", difficulty:2, prompt:"حاصل ∫_0^1 1 dx برابر است با:", choices:["1","0","x","2"], answer:0, concept:"انتگرال معین ثابت" },
        { id:"m6", topic:"integrals", parent:"calculus", difficulty:4, prompt:"حاصل ∫ x e^x dx برابر است با:", choices:["e^x(x-1)+C","e^x(x+1)+C","x e^x + C","e^x/x + C"], answer:0, concept:"انتگرال‌گیری جزءبه‌جزء" },
        { id:"m7", topic:"derivatives", parent:"calculus", difficulty:2, prompt:"مشتق d/dx (x^3) برابر است با:", choices:["3x^2","x^2","3x","x^3"], answer:0, concept:"قاعده توان در مشتق" },
        { id:"m8", topic:"derivatives", parent:"calculus", difficulty:4, prompt:"مشتق d/dx (sin(x^2)) برابر است با:", choices:["2x cos(x^2)","cos(x^2)","2x sin(x^2)","cos(2x)"], answer:0, concept:"قاعده زنجیره‌ای" },
        { id:"m9", topic:"vectors", parent:"linalg", difficulty:2, prompt:"ضرب داخلی (1,2) و (3,4) برابر است با:", choices:["11","10","14","7"], answer:0, concept:"ضرب داخلی" },
        { id:"m10", topic:"vectors", parent:"linalg", difficulty:4, prompt:"دو بردار ناصفر زمانی متعامدند که ضرب داخلی آن‌ها:", choices:["۰ باشد","۱ باشد","−۱ باشد","برابر طول آن‌ها باشد"], answer:0, concept:"تعامد" },
        { id:"m11", topic:"equations", parent:"algebra", difficulty:2, prompt:"معادله را حل کنید: 2x + 3 = 11", choices:["x=4","x=3","x=5","x=7"], answer:0, concept:"معادله خطی" },
        { id:"m12", topic:"equations", parent:"algebra", difficulty:4, prompt:"ریشه‌های x^2 - 5x + 6 = 0 کدام‌اند؟", choices:["۲ و ۳","۱ و ۶","−۲ و −۳","۵ و ۱"], answer:0, concept:"تجزیه معادله درجه دوم" },
        { id:"m13", topic:"probability", parent:"prob", difficulty:2, prompt:"احتمال آمدن شیر در پرتاب یک سکه سالم:", choices:["1/2","1/3","1/4","1"], answer:0, concept:"احتمال پایه" },
        { id:"m14", topic:"probability", parent:"prob", difficulty:4, prompt:"برای پیشامدهای مستقل A و B، مقدار P(A∩B) برابر است با:", choices:["P(A)P(B)","P(A)+P(B)","P(A|B)","P(A)-P(B)"], answer:0, concept:"استقلال" },
        { id:"m15", topic:"limits", parent:"calculus", difficulty:3, prompt:"حاصل lim_{x→0} (sin x)/x برابر است با:", choices:["1","0","∞","وجود ندارد"], answer:0, concept:"حد مثلثاتی استاندارد" }
      ]
    },
    cs: {
      label: "علوم کامپیوتر",
      description: "کاوش در الگوریتم‌ها، ساختمان داده، سیستم‌ها و پیچیدگی؛ باریک‌سازی بر اساس تسلط نشان‌داده‌شده.",
      tree: [
        { id: "algorithms", label: "الگوریتم‌ها", children: ["sorting", "graphs"] },
        { id: "datastruct", label: "ساختمان داده", children: ["arrays", "trees"] },
        { id: "systems", label: "سیستم‌ها", children: ["os", "networks"] }
      ],
      questions: [
        { id:"c1", topic:"sorting", parent:"algorithms", difficulty:2, prompt:"زمان اجرای متوسط مرتب‌سازی سریع (Quicksort) چیست؟", choices:["O(n log n)","O(n^2)","O(n)","O(log n)"], answer:0, concept:"پیچیدگی مرتب‌سازی" },
        { id:"c2", topic:"sorting", parent:"algorithms", difficulty:4, prompt:"کدام مرتب‌سازی در پیاده‌سازی‌های معمول به‌صورت پیش‌فرض پایدار است؟", choices:["Merge sort","Quicksort","Heap sort","Selection sort"], answer:0, concept:"پایداری" },
        { id:"c3", topic:"graphs", parent:"algorithms", difficulty:3, prompt:"BFS روی گراف بدون وزن چه چیزی را می‌یابد؟", choices:["کوتاه‌ترین مسیر بر حسب یال","درخت پوشای کمینه","همیشه ترتیب توپولوژیک","بیشینه جریان"], answer:0, concept:"پیمایش گراف" },
        { id:"c4", topic:"arrays", parent:"datastruct", difficulty:2, prompt:"زمان دسترسی با اندیس در آرایه معمولاً:", choices:["O(1)","O(n)","O(log n)","O(n log n)"], answer:0, concept:"دسترسی تصادفی" },
        { id:"c5", topic:"trees", parent:"datastruct", difficulty:3, prompt:"پیمایش inorder در یک BST کلیدها را به چه صورت می‌دهد؟", choices:["مرتب","معکوس","سطحی","تصادفی"], answer:0, concept:"ویژگی BST" },
        { id:"c6", topic:"trees", parent:"datastruct", difficulty:4, prompt:"جستجو/درج در BST متوازن:", choices:["O(log n)","O(n)","O(1)","O(n log n)"], answer:0, concept:"پیچیدگی درخت متوازن" },
        { id:"c7", topic:"os", parent:"systems", difficulty:3, prompt:"بن‌بست (Deadlock) به انحصار متقابل، نگه‌داشت و انتظار، عدم پیش‌دستی و ... نیاز دارد:", choices:["انتظار حلقوی","گرسنگی","صفحه‌بندی","Thrashing"], answer:0, concept:"شرایط بن‌بست" },
        { id:"c8", topic:"networks", parent:"systems", difficulty:3, prompt:"TCP چه چیزی را فراهم می‌کند؟", choices:["تحویل مطمئن و مرتب","دیتاگرام غیرمطمئن","آدرس‌دهی فیزیکی","زمان‌بندی دیسک"], answer:0, concept:"لایه انتقال" }
      ]
    }
  }
};
