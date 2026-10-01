/** Tipos da API do site (docs/api-v1.md no repositório estante). */

export type Status = "quero-ler" | "lendo" | "lido";
export type Tone = "anil" | "ameixa" | "musgo" | "ambar";

export type BookSummary = {
  id: string;
  title: string;
  author: string;
  year: number | null;
  pages: number | null;
  coverId: number | null;
  color: string;
  genres?: string[];
};

export type Book = BookSummary & { genres: string[]; synopsis: string | null };

export type SocialLink = { platform: string; handle: string; verified: boolean };

export type Profile = {
  id: string;
  handle: string;
  name: string;
  bio: string;
  tone: string;
  goal: number;
  favorites: string[];
  isPrivate: boolean;
  founder: boolean;
  socials: SocialLink[];
  avatarUrl: string | null;
};

export type UserRef = { handle: string; name: string; tone: string; avatarUrl?: string | null; founder?: boolean };
export type ProfileCard = UserRef & { isPrivate: boolean; founder: boolean };

export type Entry = {
  status: Status | null;
  rating: number | null;
  liked: boolean;
  review: string;
  finishedOn: string | null;
  updatedAt: number;
};

export type ShelfEntry = Entry & { book: BookSummary };

export type Account = {
  profile: Profile;
  shelf: ShelfEntry[];
  following: string[];
  requested: string[];
  blocked: string[];
  hasPassword: boolean;
  /** Plano: brochura (grátis) ou capa-dura. Assinar e gerenciar é pelo site. */
  plan?: { plan: "brochura" | "capa-dura" | "ex-libris"; status: string | null; interval: "month" | "year" | null; periodEnd: number | null; canceling: boolean };
};

export type Review = {
  id: string;
  user: UserRef;
  book: Pick<BookSummary, "id" | "title" | "author" | "coverId" | "color" | "year">;
  rating: number | null;
  text: string;
  date: string;
  likes: number | null;
  reactions: { likes: number; dislikes: number } | null;
  liked: boolean;
  reread: boolean;
  spoiler: boolean;
};

export type BookStats = { readers: number; avg: number; histogram: number[]; reading: number; wantToRead: number };

export type BookPage = {
  book: Book;
  stats: BookStats;
  reviews: Review[];
  buy: { store: string; href: string } | null;
  myEntry: Entry | null;
};

export type ProfileBook = Pick<BookSummary, "id" | "title" | "author" | "coverId" | "color" | "year">;

export type ProfileView = {
  handle: string;
  name: string;
  bio: string;
  tone: string;
  avatarUrl: string | null;
  goal: number;
  isDemo: boolean;
  isPrivate: boolean;
  founder: boolean;
  socials: SocialLink[];
  followers: number | null;
  following: number | null;
  content: {
    favorites: ProfileBook[];
    reading: ProfileBook[];
    diary: { book: ProfileBook; rating: number | null; date: string; liked: boolean; reread: boolean }[];
    reviews: Review[];
    readThisYear: number;
    shelfCount: number;
  } | null;
};

export type ProfileAccess = "public" | "granted" | "login" | "not_follower" | "blocked";

export type FeedItem = ShelfEntry & { user: UserRef };

export type NotificationItem = {
  id: string;
  type: "follow" | "follow_request" | "follow_accepted" | "review_like" | "friend_finished" | "discussion_reply";
  actor: ProfileCard;
  bookId: string | null;
  bookTitle: string | null;
  createdAt: number;
  read: boolean;
  pending: boolean;
};

export type AnnotationKind = "quote" | "note";

export type Annotation = {
  id: string;
  kind: AnnotationKind;
  text: string;
  comment: string;
  page: number | null;
  book: { id: string; title: string; author: string; coverId: number | null; color: string };
  createdAt: number;
  updatedAt: number;
};

export type Progress = { page: number; totalPages: number | null; updatedAt: number };

/** Uso do plano. Limite null = sem limite. */
export type Usage = {
  plan: "brochura" | "capa-dura" | "ex-libris";
  planName: string;
  quotes: number;
  quotesLimit: number | null;
  notesInBook: number;
  notesPerBookLimit: number | null;
};

export type ReadingData = { progress: Progress | null; annotations: Annotation[]; usage: Usage };

export type Author = { handle: string; name: string; tone: string; avatarUrl: string | null; founder: boolean };

/** Discussão. spoiler = fala de uma página que a pessoa ainda não leu (title e body vêm null). */
export type Thread = {
  id: string;
  bookId: string;
  page: number;
  spoiler: boolean;
  title: string | null;
  body: string | null;
  author: Author;
  replyCount: number;
  mine: boolean;
  hidden: boolean;
  createdAt: number;
  lastActivityAt: number;
};

export type Post = { id: string; page: number; spoiler: boolean; body: string | null; author: Author; mine: boolean; hidden: boolean; createdAt: number };

/** page: até onde a pessoa vê (null = tudo). bookmark: a página do marcador, usada como padrão ao escrever. */
export type Viewer = { loggedIn: boolean; page: number | null; finished: boolean; revealed: boolean; bookmark: number };

export type ThreadUsage = { planName: string; threadsThisMonth: number; threadsPerMonthLimit: number | null };

/** Clubes de leitura (Ex Libris cria; qualquer conta entra pelo convite). */
export type ClubBook = { id: string; title: string; author: string; coverId: number | null; color: string };
export type ClubSummary = { id: string; name: string; description: string; book: ClubBook | null; members: number; role: "owner" | "member" };
export type ClubMember = UserRef & { role: "owner" | "member"; page: number | null; totalPages: number | null; finished: boolean };
export type Club = ClubSummary & { inviteCode: string | null; memberList: ClubMember[]; maxMembers: number };
export type ClubInvite = { id: string; name: string; description: string; book: ClubBook | null; members: number; ownerName: string; alreadyMember: boolean };
