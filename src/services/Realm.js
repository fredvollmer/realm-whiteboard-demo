import { Credentials, User, GraphQLConfig } from 'realm-graphql-client';
import { concat, HttpLink, ApolloClient, InMemoryCache } from 'apollo-client-preset';
import { WebSocketLink } from 'apollo-link-ws';
import { split } from 'apollo-client-preset';
import { getMainDefinition } from 'apollo-utilities';
import {REALM_ENDPOINT, REALM_ID} from "../Constants";

export const realmClient = (async function initialize() {
    // Nickname credentials basically let us say we're whoever we want--obviously not for production use :)
    const credentials = Credentials.nickname(`547-user-${Math.ceil(Math.random() * 1000)}`, true);
    const user = await User.authenticate(credentials, REALM_ENDPOINT);

    // Create a GraphQL configuration given our user and the realm ID specified over in Constants
    const config = await GraphQLConfig.create(
        user,
        `/${REALM_ID}`,
    );

    // The HttpLink is used for executing queries and writes against the Realm Object Server
    const httpLink = concat(
        config.authLink,
        new HttpLink({ uri: config.httpEndpoint })
    );

    // the WebSocket link is used for creating and listening to subscriptions.
    // In other words, it's how we hear about changes to the realm and stay in sync!
    const webSocketLink = new WebSocketLink({
        uri: config.webSocketEndpoint,
        options: {
            connectionParams: config.connectionParams,
        }
    });

    // This just creates a unified link interface that knows how to split traffic between the HTTP and WebSocket links
    const link = split(
        ({ query }) => {
            const { kind, operation } = getMainDefinition(query);
            return kind === 'OperationDefinition' && operation === 'subscription';
        },
        webSocketLink,
        httpLink,
    );

    // Finally, create the client--this is what we'll use to interact with Realm!
    // The in-memory cache helps reduce traffic to the Realm Object Server
    return new ApolloClient({
        link: link,
        cache: new InMemoryCache()
    });
})();

export async function query(query) {
    const rc = await realmClient;
    try {
        const response = await rc.query({query});
        return response.data;
    } catch (e) {
        console.error('An error occurred running realm query', e);
    }
}

export async function update(mutation) {
    const rc = await realmClient;

    try {
        const response = await rc.mutate({mutation});
        return response.data;
    } catch (e) {
        console.error('An error occurred updating realm', e);
    }
}

export async function subscribe(query, handler) {
    const rc = await realmClient;

    const observable = await rc.subscribe({query});

    observable.subscribe({
        next({data}) {
            handler(data);
        },
        error(e) {
            console.error('An error ocurred with the realm subscription', e);
        }
    });
}