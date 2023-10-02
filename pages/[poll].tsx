import Head from "next/head";
import { createApolloFetch } from "apollo-fetch";
import IPFS from "ipfs-mini";
import fm from "front-matter";
import { useRouter } from "next/router";

export default function Home({ poll, orchestratorPollVoters, orchestratorPollNonVoters, totalDelegatorVotes }) {
  const router = useRouter();

  // If the page is not yet generated, this will be displayed
  // initially until getStaticProps() finishes running
  if (router.isFallback) {
    return <div>Loading...</div>;
  }
  return (
    <div className="container">
      <Head>
        <title>LIP-{poll.lip} Poll Stats</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main>
        <h1 className="title">LIP-{poll.lip} Poll Stats</h1>
        {/* <h2>Total Delegate Votes: {orchestratorPollVoters.length}</h2>
        <h2>Total Delegator Votes: {totalDelegatorVotes}</h2> */}
        <h2 style={{ marginTop: "40px" }}>Active Orchestrator Participation</h2>
        <div className="grid">
          <div className="card">
            <h4 style={{ marginBottom: "24px" }}>Voted ({orchestratorPollVoters.length})</h4>
            <div>
              {orchestratorPollVoters.map((v, i) => (
                <div
                  key={i}
                  style={{
                    marginBottom: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <a
                    target="_blank"
                    href={`https://explorer.livepeer.org/accounts/${v.voter}/campaign`}
                    style={{ fontSize: 14, marginRight: 8 }}
                  >
                    {v.voter.replace(v.voter.slice(7, 36), "…")}
                  </a>
                  {v.choiceID}
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: "24px" }}>Did not vote ({orchestratorPollNonVoters.length})</h4>
            <div>
              {orchestratorPollNonVoters.map((addr, i) => (
                <div key={i}>
                  <a
                    key={addr}
                    target="_blank"
                    href={`https://explorer.livepeer.org/accounts/${addr}/campaign`}
                    style={{ fontSize: 14, marginBottom: "24px" }}
                  >
                    {addr.replace(addr.slice(13, 30), "…")}
                  </a>
                </div>
              ))}
            </div>
          </div>
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
          justify-content: center;
          max-width: 800px;
          margin-top: 16px;
        }

        .card {
          align-self: flex-start;
          margin: 1rem;
          min-width: 300px;
          padding: 1.5rem;
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

export async function getStaticPaths() {
  const fetchSubgraph = createApolloFetch({
    uri: `https://api.thegraph.com/subgraphs/name/livepeer/arbitrum-one`,
  });
  let { data } = await fetchSubgraph({
    query: `{
        polls {
          id
        }
      }`,
  });
  let paths = [];
  data.polls.map((poll) => paths.push({ params: { poll: poll.id } }));

  return {
    paths,
    fallback: true,
  };
}

export async function getStaticProps({ params }) {
  const fetchSubgraph = createApolloFetch({
    uri: `https://api.thegraph.com/subgraphs/name/livepeer/livepeer`,
  });

  let { data } = await fetchSubgraph({
    query: `{
        poll(id: "${params.poll}") {
          id
          proposal
        }
      }`,
  });
  const poll = await transformPoll(data.poll);

  let { data: transcoderData } = await fetchSubgraph({
    query: `{
        transcoders(orderBy: totalStake orderDirection: desc where: {active: true}) {
          id
        }
      }`,
  });
  let { data: orchestratorPollVotes } = await fetchSubgraph({
    query: `{
        poll(id: "${params.poll}") {
          votes(orderBy: voteStake orderDirection: desc where: {registeredTranscoder: true}) {
            voter
            choiceID
          }
        }
      }`,
  });

  let { data: delegatorVotes } = await fetchSubgraph({
    query: `{
        poll(id: "${params.poll}") {
          votes(orderBy: voteStake orderDirection: desc where: {registeredTranscoder: false}) {
            voter
            choiceID
          }
        }
      }`,
  });
  const orchestratorNonVoters = transcoderData.transcoders.filter((t) => {
    let isPresent = orchestratorPollVotes.poll.votes.some((v) => {
      return v.voter === t.id;
    });
    if (!isPresent) {
      return t;
    }
  });

  return {
    props: {
      poll,
      orchestratorPollVoters: orchestratorPollVotes.poll.votes,
      orchestratorPollNonVoters: orchestratorNonVoters.map(({ id }) => id),
      totalDelegatorVotes: delegatorVotes.poll.votes.length,
    },
    revalidate: true,
  };
}

async function transformPoll(poll) {
  const ipfs = new IPFS({
    host: "ipfs.infura.io",
    port: 5001,
    protocol: "https",
  });
  const { text } = await ipfs.catJSON(poll.proposal);
  const response: any = fm(text);

  return {
    ...response.attributes,
    created: response.attributes.created.toString(),
    ...poll,
  };
}
