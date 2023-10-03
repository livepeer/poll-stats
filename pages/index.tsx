import Head from "next/head";
import { createApolloFetch } from "apollo-fetch";
import Link from "next/link";
import fm from "front-matter";
import { catIpfsJson } from "../lib/ipfs";

export default function Home({ polls }) {
  return (
    <div className="container">
      <Head>
        <title>Polls</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">Polls</h1>

        <div className="grid">
          {polls.map((p) => (
            <div className="card">
              <Link key={p.id} href="/[poll]" as={`/${p.id}`}>
                <a>
                  LIP-{p.lip} - {p.title}
                </a>
              </Link>
            </div>
          ))}
        </div>
      </main>

      <style jsx>{`
        .container {
          min-height: 100vh;
          padding: 0 0.5rem;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        main {
          padding: 5rem 0;
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }

        footer {
          width: 100%;
          height: 100px;
          border-top: 1px solid #eaeaea;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        footer img {
          margin-left: 0.5rem;
        }

        footer a {
          display: flex;
          justify-content: center;
          align-items: center;
        }

        a {
          color: inherit;
          text-decoration: none;
        }

        .title a {
          color: #0070f3;
          text-decoration: none;
        }

        .title a:hover,
        .title a:focus,
        .title a:active {
          text-decoration: underline;
        }

        .title {
          margin: 0;
          line-height: 1.15;
          font-size: 4rem;
        }

        .title,
        .description {
          text-align: center;
        }

        .description {
          line-height: 1.5;
          font-size: 1.5rem;
        }

        code {
          background: #fafafa;
          border-radius: 5px;
          padding: 0.75rem;
          font-size: 1.1rem;
          font-family: Menlo, Monaco, Lucida Console, Liberation Mono, DejaVu Sans Mono, Bitstream Vera Sans Mono,
            Courier New, monospace;
        }

        .grid {
          display: flex;
          flex-direction: column;
          justify-content: center;
          max-width: 960px;
          margin-top: 16px;
        }

        .card {
          align-self: center;
          margin-bottom: 20px;
          padding: 1.5rem;
          width: 100%;
          text-align: left;
          color: inherit;
          text-decoration: none;
          border: 1px solid #eaeaea;
          border-radius: 10px;
          transition: color 0.15s ease, border-color 0.15s ease;
        }

        .card h3 {
          margin: 0 0 1rem 0;
          font-size: 1.5rem;
        }

        .card a {
          display: block;
          color: blue;
        }

        .card p {
          margin: 0;
          font-size: 1.25rem;
          line-height: 1.5;
        }

        .logo {
          height: 1em;
        }

        @media (max-width: 600px) {
          .grid {
            width: 100%;
            flex-direction: column;
          }
        }
      `}</style>

      <style jsx global>{`
        html,
        body {
          padding: 0;
          margin: 0;
          font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans,
            Droid Sans, Helvetica Neue, sans-serif;
        }

        * {
          box-sizing: border-box;
        }
      `}</style>
    </div>
  );
}

export async function getStaticProps() {
  const fetchSubgraph = createApolloFetch({
    uri: `https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-one`,
  });
  let { data } = await fetchSubgraph({
    query: `{
        polls(where: {id_not: "0x17759123c2ddcd774a1a0c577fa32a24deff5629"}) {
          id
          proposal
        }
      }`,
  });

  return {
    props: {
      polls: await transformPolls(data.polls),
    },
    revalidate: true,
  };
}

async function transformPolls(polls) {
  let transormedPolls = [];
  for (const poll of polls) {
    const { text } = await catIpfsJson(poll.proposal);
    const response: any = fm(text);
    transormedPolls.push({
      ...response.attributes,
      created: response.attributes.created.toString(),
      ...poll,
    });
  }
  return transormedPolls.reverse();
}
