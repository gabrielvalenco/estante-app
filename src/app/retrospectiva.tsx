import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Lock, Quote, Share2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, Share, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BookLink, Stars, formatRating } from "@/components/book";
import { Button, Chip, Empty, Loading, Text } from "@/components/ui";
import { api } from "@/lib/api";
import { useColors } from "@/lib/theme";
import type { BookSummary } from "@/lib/types";

type RetroBook = BookSummary & { rating: number | null; finishedOn: string };
type Retro = {
  year: number;
  inProgress: boolean;
  years: number[];
  basic: { booksRead: number; goal: number; pagesRead: number; pagesKnown: number; avgRating: number | null; topRated: RetroBook | null; byMonth: number[]; covers: RetroBook[] };
  full: {
    topAuthors: { name: string; books: number }[];
    longest: RetroBook | null;
    shortest: RetroBook | null;
    first: RetroBook | null;
    last: RetroBook | null;
    liked: number;
    reviews: number;
    ratings: number[];
    quotes: number;
    notes: number;
    quoteOfYear: { text: string; bookTitle: string; page: number | null } | null;
    threads: number;
    replies: number;
  } | null;
  plan: { name: string; full: boolean };
};

const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const MONTHS_FULL = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];

/** Retrospectiva do ano no app: a mesma do site, com compartilhar pelo celular. */
export default function Retrospective() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const [year, setYear] = useState<number | null>(null);
  const q = useQuery({ queryKey: ["retrospective", year], queryFn: () => api<Retro>(`/retrospective${year ? `?year=${year}` : ""}`) });

  if (q.isPending) return <Loading />;
  if (!q.data) return <Empty title="Não deu para montar a retrospectiva">Tente de novo em instantes.</Empty>;
  const r = q.data;
  const b = r.basic;
  const goalPct = b.goal ? Math.min(100, Math.round((b.booksRead / b.goal) * 100)) : 0;

  const share = () =>
    void Share.share({
      message: `Minha leitura em ${r.year}${r.inProgress ? ", até agora" : ""}: ${b.booksRead} ${b.booksRead === 1 ? "livro" : "livros"}${b.pagesKnown ? `, ${b.pagesRead.toLocaleString("pt-BR")} páginas` : ""}${b.topRated ? `. Favorito: ${b.topRated.title}` : ""}. Na Estante 📚`,
    });

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}>
      <View style={{ gap: 8 }}>
        <Text variant="hero">
          Sua leitura em {r.year}
          {r.inProgress ? <Text variant="hero" tone="ink4">, até agora</Text> : null}
        </Text>
        {r.years.length > 1 ? (
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            {r.years.map((y) => (
              <Chip key={y} label={String(y)} active={y === r.year} onPress={() => setYear(y)} />
            ))}
          </View>
        ) : null}
      </View>

      {b.booksRead === 0 ? (
        <Empty title={`Nenhum livro lido em ${r.year}`} action={<Button onPress={() => router.push("/buscar")}>Buscar livros</Button>}>
          Marque um livro como lido, com a data em que terminou, e ele entra na sua retrospectiva.
        </Empty>
      ) : (
        <>
          <View style={{ backgroundColor: "#1d1850", borderRadius: 24, padding: 20, gap: 14 }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
              <View>
                <Text style={{ color: "rgba(255,255,255,0.7)" }}>{r.inProgress ? "Até agora, você leu" : "Você leu"}</Text>
                <View style={{ flexDirection: "row", alignItems: "baseline", gap: 8 }}>
                  <Text weight="bold" style={{ color: "#fff", fontSize: 72, lineHeight: 80, letterSpacing: -3 }}>
                    {b.booksRead}
                  </Text>
                  <Text variant="title" style={{ color: "#8f89ff" }}>
                    {b.booksRead === 1 ? "livro" : "livros"}
                  </Text>
                </View>
              </View>
              <Pressable onPress={share} accessibilityRole="button" accessibilityLabel="Compartilhar retrospectiva" hitSlop={8} style={{ padding: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.12)" }}>
                <Share2 size={18} color="#fff" />
              </Pressable>
            </View>
            <View style={{ flexDirection: "row", gap: 20, flexWrap: "wrap" }}>
              {b.pagesKnown ? <HeroStat value={b.pagesRead.toLocaleString("pt-BR")} label="páginas" /> : null}
              {b.avgRating !== null ? <HeroStat value={`${formatRating(b.avgRating)}★`} label="nota média" /> : null}
              <HeroStat value={`${goalPct}%`} label={`da meta de ${b.goal}`} />
            </View>
            <View style={{ height: 8, borderRadius: 4, backgroundColor: "rgba(255,255,255,0.12)", overflow: "hidden" }}>
              <View style={{ width: `${goalPct}%`, height: 8, backgroundColor: "#5cc88a" }} />
            </View>
          </View>

          <Bars title="Livros por mês" values={b.byMonth} labels={MONTHS} describe={(i, v) => `${MONTHS_FULL[i]}: ${v} ${v === 1 ? "livro" : "livros"}`} color={c.anil} />

          {b.topRated ? (
            <Card title="Favorito do ano">
              <BookRow book={b.topRated} />
            </Card>
          ) : null}

          <Covers books={b.covers} />

          {r.full ? <Full full={r.full} year={r.year} /> : <Locked planName={r.plan.name} />}
        </>
      )}
    </ScrollView>
  );
}

function HeroStat({ value, label }: { value: string; label: string }) {
  return (
    <View>
      <Text variant="title" style={{ color: "#fff" }}>
        {value}
      </Text>
      <Text variant="small" style={{ color: "rgba(255,255,255,0.6)" }}>
        {label}
      </Text>
    </View>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  const c = useColors();
  return (
    <View style={{ backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, padding: 16, gap: 10 }}>
      <Text variant="caption" tone="ink3">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function BookRow({ book, note }: { book: RetroBook; note?: string }) {
  return (
    <Pressable onPress={() => router.push(`/livro/${book.id}`)} style={{ flexDirection: "row", gap: 12, alignItems: "center" }}>
      <BookLink book={book} width={48} />
      <View style={{ flex: 1, gap: 2 }}>
        <Text variant="label" numberOfLines={2}>
          {book.title}
        </Text>
        <Text variant="small" tone="ink3" numberOfLines={1}>
          {book.author}
        </Text>
        {book.rating !== null ? <Stars rating={book.rating} size={12} /> : null}
        {note ? (
          <Text variant="caption" tone="ink4">
            {note}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Barras de uma série: rótulo só na maior, cada barra com descrição para leitor de tela. */
function Bars({ title, values, labels, describe, color }: { title: string; values: number[]; labels: string[]; describe: (i: number, v: number) => string; color: string }) {
  const c = useColors();
  const max = Math.max(1, ...values);
  const peak = values.findIndex((v) => v === max && v > 0);
  const [active, setActive] = useState<number | null>(null);
  return (
    <Card title={title}>
      <Text variant="small" tone="ink3" style={{ minHeight: 18 }}>
        {active !== null ? describe(active, values[active]) : "Toque numa barra para ver o número."}
      </Text>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: 120, gap: 2, paddingTop: 18, borderBottomWidth: 1, borderColor: c.line }}>
        {values.map((v, i) => (
          <Pressable
            key={i}
            onPress={() => setActive(active === i ? null : i)}
            accessibilityRole="button"
            accessibilityLabel={describe(i, v)}
            style={{ flex: 1, height: "100%", justifyContent: "flex-end", alignItems: "center" }}
          >
            {i === peak && active === null ? (
              <Text variant="caption" tone="ink2">
                {v}
              </Text>
            ) : null}
            <View style={{ width: "80%", height: v ? `${Math.max(4, (v / max) * 100)}%` : 0, backgroundColor: color, borderTopLeftRadius: 4, borderTopRightRadius: 4, opacity: active === null || active === i ? 1 : 0.4 }} />
          </Pressable>
        ))}
      </View>
      <View style={{ flexDirection: "row", gap: 2 }}>
        {labels.map((l, i) => (
          <Text key={i} variant="caption" tone="ink4" style={{ flex: 1, textAlign: "center" }}>
            {l}
          </Text>
        ))}
      </View>
    </Card>
  );
}

function Covers({ books }: { books: RetroBook[] }) {
  const { width } = useWindowDimensions();
  const size = Math.floor((width - 32 - 3 * 10) / 4);
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
      {books.map((b) => (
        <BookLink key={b.id} book={b} width={size} />
      ))}
    </View>
  );
}

const shortDate = (iso: string) => new Date(`${iso}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" });

function Full({ full, year }: { full: NonNullable<Retro["full"]>; year: number }) {
  const c = useColors();
  return (
    <>
      {full.topAuthors.length ? (
        <Card title="Autores do ano">
          {full.topAuthors.map((a, i) => (
            <View key={a.name} style={{ flexDirection: "row", gap: 10 }}>
              <Text tone="ink4">{i + 1}.</Text>
              <Text weight="medium" style={{ flex: 1 }}>
                {a.name}
              </Text>
              <Text tone="ink3">
                {a.books} {a.books === 1 ? "livro" : "livros"}
              </Text>
            </View>
          ))}
        </Card>
      ) : null}
      <Bars
        title="Livros por nota"
        values={full.ratings}
        labels={full.ratings.map((_, i) => (i % 2 ? String((i + 1) / 2) : ""))}
        describe={(i, v) => `${formatRating((i + 1) / 2)} estrelas: ${v} ${v === 1 ? "livro" : "livros"}`}
        color={c.ambarInk}
      />
      <Text variant="small" tone="ink3">
        {full.liked} {full.liked === 1 ? "livro curtido" : "livros curtidos"} · {full.reviews} {full.reviews === 1 ? "review escrita" : "reviews escritas"}
      </Text>
      {full.longest ? (
        <Card title="O mais longo">
          <BookRow book={full.longest} note={`${full.longest.pages} páginas`} />
          {full.shortest && full.shortest.id !== full.longest.id ? (
            <>
              <Text variant="caption" tone="ink3">
                O MAIS CURTO
              </Text>
              <BookRow book={full.shortest} note={`${full.shortest.pages} páginas`} />
            </>
          ) : null}
        </Card>
      ) : null}
      {full.first ? (
        <Card title={`O primeiro de ${year}`}>
          <BookRow book={full.first} note={`Terminado em ${shortDate(full.first.finishedOn)}`} />
          {full.last ? (
            <>
              <Text variant="caption" tone="ink3">
                O MAIS RECENTE
              </Text>
              <BookRow book={full.last} note={`Terminado em ${shortDate(full.last.finishedOn)}`} />
            </>
          ) : null}
        </Card>
      ) : null}
      <Card title="Anotações e conversas">
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 18 }}>
          {[
            [full.quotes, "citações"],
            [full.notes, "notas"],
            [full.threads, "discussões"],
            [full.replies, "respostas"],
          ].map(([n, label]) => (
            <View key={String(label)}>
              <Text variant="title">{n}</Text>
              <Text variant="small" tone="ink3">
                {label}
              </Text>
            </View>
          ))}
        </View>
        {full.quoteOfYear ? (
          <View style={{ backgroundColor: c.sunken, borderRadius: 16, padding: 14, gap: 6 }}>
            <Quote size={18} color={c.ambar} />
            <Text style={{ fontSize: 17, lineHeight: 25 }}>“{full.quoteOfYear.text}”</Text>
            <Text variant="small" tone="ink3">
              Sua citação do ano · {full.quoteOfYear.bookTitle}
              {full.quoteOfYear.page ? `, p. ${full.quoteOfYear.page}` : ""}
            </Text>
          </View>
        ) : null}
      </Card>
    </>
  );
}

function Locked({ planName }: { planName: string }) {
  const c = useColors();
  return (
    <View style={{ borderRadius: 20, borderWidth: 2, borderStyle: "dashed", borderColor: c.anil, backgroundColor: c.anilSoft, padding: 18, gap: 8 }}>
      <Lock size={18} color={c.anil} />
      <Text variant="section">A retrospectiva completa é do Capa Dura</Text>
      <Text variant="small" tone="ink2">
        Você está no plano {planName}. No Capa Dura, ela também mostra seus autores do ano, a distribuição das notas, o livro mais longo e o mais curto,
        citações, notas, discussões e a sua citação do ano.
      </Text>
      <Button onPress={() => router.push("/planos")} style={{ marginTop: 6 }}>
        Conhecer o Capa Dura
      </Button>
    </View>
  );
}
