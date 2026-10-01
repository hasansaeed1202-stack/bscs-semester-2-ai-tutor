const facts = {
  1: ['Model problems as collaborating objects that combine identity, state, and behavior.', 'A Library can delegate borrowing to Member and availability to Book.'],
  2: ['A C++ struct groups related fields and is a class with public access by default.', 'struct Point { int x; int y; }; Point p{2,3};'],
  3: ['Procedure-centered designs can scatter validation across functions and expose shared state.', 'A private balance updated by withdraw() centralizes the rule that balance cannot become negative.'],
  4: ['C++ struct and class have the same capabilities; struct defaults to public and class to private.', 'struct Point exposes simple coordinates, while class Account hides its balance.'],
  5: ['A class defines a type; an object is an instance with its own non-static state.', 'Counter a, b; gives a and b separate count values.'],
  6: ['A public interface exposes operations while private representation preserves class invariants.', 'Rectangle r{4,3}; r.area() uses behavior without exposing the area formula.'],
  7: ['A class declaration contains access sections and ends with a semicolon; outside definitions use ClassName::.', 'int Box::area() const { return width * height; }'],
  8: ['Non-static data members store each object’s state and live as long as that object.', 'Circle stores radius and derives area instead of storing two values that may disagree.'],
  9: ['Encapsulation restricts representation access so operations can maintain invariants.', 'Account::deposit validates a positive amount before changing private balance.'],
  10: ['public is client-accessible, protected is available to derived classes, and private is class/friend-only.', 'A public setter may validate before updating a private field.'],
  11: ['Ordinary members belong to each object; static members are shared by the class.', 'Employee::count can track all instances while each Employee has a separate id.'],
  12: ['Use dot for an object and arrow for a pointer; p->f() equals (*p).f().', 'Student s; Student* p=&s; makes s.name() and p->name() equivalent.'],
  13: ['Member functions operate on an object; a const member promises not to change observable state.', 'double Circle::area() const reads radius without modifying it.'],
  14: ['Constructors establish valid state and destructors release owned resources automatically.', 'A FileOwner opens in its constructor and closes in ~FileOwner().'],
  15: ['Overloads share a name but differ by parameter list; return type alone cannot distinguish them.', 'print(int) and print(string) are valid related overloads.'],
  16: ['Constructor overloads offer different valid initialization forms and can delegate to one canonical constructor.', 'Time() : Time(0,0) {} reuses Time(int,int) validation.'],
  17: ['A default constructor is callable with no arguments; declaring another constructor suppresses the implicit one.', 'Vector2() : x(0), y(0) {} creates a meaningful zero vector.'],
  18: ['Operator overloads cannot change operator arity, precedence, or associativity and should preserve familiar meaning.', 'Complex operator+ returns a new sum without changing either operand.'],
  19: ['A member unary overload has no explicit operand; a member binary overload receives its right operand.', 'Vector::operator-() negates *this; operator+(rhs) combines two vectors.'],
  20: ['Public inheritance models an is-a relationship and requires substitutability.', 'SavingsAccount may derive from Account, but Engine belongs inside Car by composition.'],
  21: ['Base construction finishes before derived construction; destruction runs in reverse order.', 'Savings(b,r) : Account(b), rate(r) initializes its base first.'],
  22: ['A base class defines a common contract; a polymorphic base normally needs a virtual destructor.', 'Shape declares virtual area() and virtual ~Shape()=default.'],
  23: ['A derived class specializes accessible base behavior but cannot directly access private base members.', 'Circle implements double area() const override from Shape.'],
  24: ['Inheritance structures include single, multilevel, hierarchical, multiple, and hybrid forms.', 'Vehicle→Car→ElectricCar is multilevel; Car and Bus from Vehicle are hierarchical.'],
  25: ['Public inheritance preserves public/protected access; protected makes both protected; private makes both private.', 'In D : protected B, an accessible public B member becomes protected in D.'],
  26: ['Overriding matches a base virtual signature; override lets the compiler detect mismatches.', 'Dog::speak() const override replaces Animal::speak() const for Dog objects.'],
  27: ['Multiple inheritance creates several direct base subobjects; virtual inheritance resolves a shared-base diamond.', 'ScannerPrinter can implement independent Scanner and Printer interfaces.'],
  28: ['Runtime polymorphism dispatches virtual calls by dynamic type through a base reference or pointer.', 'A vector of unique_ptr<Shape> can call the correct area() for each shape.'],
  29: ['A virtual call uses runtime type; a pure virtual function uses =0 and makes its class abstract.', 'Shape& s=circle; s.area() calls Circle::area().'],
  30: ['A friend is a non-member granted private access; friendship is explicit, non-transitive, and non-reciprocal.', 'A friend operator<< can print private Point coordinates.'],
  31: ['A static member function has no this pointer and directly accesses only static members.', 'Employee::getCount() reads shared employeeCount without an object.'],
  32: ['Class relationships encode knowing, ownership, containment, or generalization.', 'Course associates with Students; Order composes LineItems.'],
  33: ['Association connects independently living objects without implying ownership.', 'A Doctor treats Patients that exist independently of that doctor.'],
  34: ['Aggregation is weak whole-part ownership: the part can outlive and may be shared by the whole.', 'A Department aggregates Professors who continue to exist if it closes.'],
  35: ['Composition is strong ownership: a part’s lifetime is controlled by its whole.', 'Room members stored by value are destroyed with their House.'],
  36: ['Generalization factors a valid common abstraction from specialized types.', 'Circle and Rectangle generalize to Shape because both honor area().'],
  37: ['A nested class belongs to enclosing class scope but has no automatic outer-object reference.', 'List::Node can remain a private implementation type of List.'],
  38: ['A thrown exception transfers control to a matching handler while stack unwinding destroys automatic objects.', 'vector::at may throw out_of_range for an invalid index.'],
  39: ['try encloses risky work, throw reports failure, and catch handles it; catch polymorphic exceptions by const reference.', 'catch (const std::exception& e) preserves dynamic exception behavior.'],
  40: ['istream reads, ostream writes, iostream does both, and file stream classes connect them to files.', 'ifstream in("scores.txt"); in >> score; extracts an integer.'],
  41: ['Streams record goodbit, eofbit, failbit, and badbit; test the read operation rather than eof() alone.', 'while (in >> value) processes only successful extractions.'],
  42: ['File streams use modes such as in, out, app, trunc, and binary; every critical operation must be checked.', 'ofstream log("app.log", ios::app) preserves old content and appends.'],
  43: ['A pointer stores an address; & obtains it, * dereferences it, and nullptr means no object.', 'int n=5; int* p=&n; *p=7; changes n to 7.'],
  44: ['A template describes a family instantiated for supplied arguments; its definition must be visible when instantiated.', 'maxValue<int> and maxValue<double> use one generic algorithm.'],
  45: ['A function template generalizes an algorithm and usually deduces type arguments from call arguments.', 'swapValues(T&,T&) works for any suitable same-type pair.'],
  46: ['A class template creates distinct class types for its template arguments.', 'Box<int> and Box<string> are separate specializations.'],
  47: ['The STL combines containers, iterators, and algorithms over half-open [first,last) ranges.', 'sort(values.begin(), values.end()) orders every vector element.'],
}

const titles = ['problem solving in object oriented programming','revision of structures','identification of problems in structural programming','structures vs classes','classes and objects','basics of classes and objects','syntax of class','data members','data encapsulation','member access specifiers','types of data members','accessing data from objects','member functions','constructors and destructors','function overloading','constructor overloading','default constructor','operator overloading','overloading unary and binary operators','inheritance','basics of inheritance','base class','child class','types of inheritance','rules for public private protected inheritance','function overriding','multiple inheritance','polymorphism','virtual functions','friend functions','static functions','relationship between classes','association','aggregation','composition','generalization','inner nested classes','exceptions','exception handling','stream classes','stream errors','file handling','fundamentals of pointers','templates','function templates','class templates','standard template library']

function slug(value) { return value.replaceAll(' ', '-').replace('inner-nested', 'inner-nested') }

export const oopTopics = Object.fromEntries(titles.map((title, index) => {
  const number = index + 1
  const [definition, example] = facts[number]
  const idTitle = number === 25 ? 'rules-for-public-private-protected-inheritance' : number === 32 ? 'relationship-between-classes' : slug(title)
  return [`oop-topic-${number}-${idTitle}`, {
    note: { heading: title.replace(/\b\w/g, c => c.toUpperCase()), explanation: definition, keyPoints: [`Definition: ${definition}`, `Rule: Apply the stated C++ access, type, ownership, or lifetime constraint before choosing syntax.`, `Exam focus: explain ${title}, trace the example, and justify the design.`, `Common mistake: quoting syntax without checking the conditions that make ${title} correct.`], example },
    practice: { prompt: `Explain the rule demonstrated by this example: ${example}`, hint: `Relate the example to the definition of ${title}.`, answer: definition, explanation: `The example is a worked application of this rule: ${definition}` },
    quiz: { prompt: `Which statement correctly describes ${title}?`, choices: [definition, 'It disables C++ type checking.', 'It makes access and object lifetime irrelevant.', 'It requires every member to be public.'], correctIndex: 0, explanation: definition },
  }]
}))
