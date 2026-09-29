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
  type: "follow" | "follow_request" | "follow_accepted" | "review_like" | "friend_finished";
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
