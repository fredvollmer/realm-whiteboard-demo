# Realm Whiteboard

Slides: https://docs.google.com/presentation/d/1fQNdyIbpZKIKs24X6_fSbtZYiEPiR3RcjCv3oSBFyJ8/edit?usp=sharing

This is going to be a breakneck-speed intro to two novel technologies: Realm and GraphQL.
Realm is a realtime object store with a focus on mobile clients.
GraphQL, which can be used to interact with Realm, is an alternative to REST API's that can prove to be superior.

With such a short time limit, we're not going to try and dive into the theory of Realm as a database (although it is incredibly interesting, and essential to really understanding under what circumstances Realm can excel).
Instead we're going to try and get something built using these two tools and see for ourselves what they can be good for.

But, if you're interested, here are resources to go more in depth on what we talk about:

Realm Platform Overview
https://docs.realm.io/sync/getting-started-1

Deep-dive on Sync
https://docs.realm.io/sync/realm-sync-a-primer/realm-sync-the-details#sync-details

GraphQL
https://graphql.org/learn/


## Setup

1. Make sure you have NodeJS > v10 installed. Run `node -v` to verify. If you need to install or upgrade,
head to https://nodejs.org/en/ download the LTS release and go through the installer.
You may need to restart your terminal after install.

2. Clone this repo anywhere on your machine
```
git clone https://github.com/fredvollmer/realm-whiteboard-demo.git
```

3. Make the newly cloned repo your current working directory
```
cd realm-whiteboard-demo
```

4. Install project dependencies
```
npm install
```

5. Start the development server
```
npm run start
```

6. Open the app (it won't work yet :)) by going to http://localhost:1234

## Important prerequisite: async/await in JavaScript

```javascript
// This function is async, meaning it can return before all contained operations are done running
async function myAsyncFunction() {
    const x = 4;
    const result = await doSomethingAsynchronouLikeANetworkCall();
    // We won't hit this next line until the network call is done.
    If await was omitted, we would hit the next line immeidately, before the network op was done.
    console.log(result);
}
```

## The goal

<iframe src="https://drive.google.com/file/d/1xQzdELHVESG5v2g7Up8APm9vXLqhLxNm/preview?autoplay=1"></iframe>

We want to build a shared, realtime whiteboard that runs in the browser and allows users to do the following:
- Draw something (a `path`, to be precise--more on that later) on the shared whiteboard by clicking and dragging their mouse.
- Change the color of an existing drawing by left-clicking on it.
- Delete a drawing by right-clicking on it.

Any of these actions--create, update, delete--should be reflected quickly in the browsers of all connected users.

## Potential solutions
- Backend database, a REST API server, a queue or pub/sub service and WebSockets
    - What purpose does each of these components serve to our end goal?
    - Which database would be best?
- A realtime database ("data access as a service")
- Any other ideas?

## The Realtime Database Approach
- What is a realtime database?
- What are the advantages of a realtime database? Disadvantages?

## Enter Realm
https://realm.io



## Our data model
Our whiteboard realm has a single type of object: `path`. A `path` represents a line/curve drawn on the whiteboard by a user--from mouse down to mouse up.

A `path` contains the following fields:
- `pathId`: A unique, randomly generated string identifying this path. **This serves as the primary key for the `path` object type**
- `color`: A string (rgb, hex, any valid CSS color) representing the color of this path on the whiteboard
- `polyline` A [polyline string](https://developers.google.com/maps/documentation/utilities/polylinealgorithm) encoding the actual points in this path.

A whiteboard consists of a set of these `path` objects. If I draw a new shape no the whiteboard, a `path` needs to be added to the database.
If I want to "erase" something, the corresponding `path` needs to be deleted from the database.
If I want to update a path, such as changing its color, the `path` must be updated in the database.

## Using Realm + GraphQL

### What is GraphQL?

In short, it's an alternative to REST API's, that makes some improvements on how a client interacts with a server.
Whereas REST focus on **resources**, GraphQL represents everything an API has to offer as a connected graph.
- With REST, the client isn't in control of what they get--it's up to the server.
    - Leads to over fetching/under fetching, and results in multiple requests to get all needed data.
    - If client needs a new "view" of the data, the backend has to implement it
- With GraphQL, there's only a single endpoint, from which the client can ask for exactly what they need (or describe a mutation (update), or subscribe for changes...)
- queries and mutations happen over HTTP; subscription updates are delivered via WebSocket

#### Example: Social Network
Let's pretend we have `users`, `posts` and `followers`.
    - How are they related?

See slides.

### Querying
https://docs.realm.io/sync/graphql-web-access/graphiql-explorer#querying

#### All objects of a given type
```
query {
    <plural object type name> {
        <fields to return, one per line>
    }
}
```

Example
```
query {
    users {
        userId
        name
        age
        gender
        lastLogin
    }
}
```

#### Filtered objects of a given type
The query expressions are described at https://realm.io/docs/javascript/latest/#filtering
```
query {
    <plural object type name>(query: <query string>) {
        <fields to return, one per line>
    }
}
```

Example
```
query {
    users(query: "gender = 'female' AND name STARTSWITH 'a'") {
        name
        age
        gender
        lastLogin
    }
}
```

#### A single object for a given primary key
```
query {
    <object type>(<primary key>: <primary key value>) {
        <fields to return, one per line>
    }
}
```
Example:
```
query {
    user(userId: "abc123") {
        name
        age
        gender
        lastLogin
    }
}
```

### Creation
https://docs.realm.io/sync/graphql-web-access/graphiql-explorer#adding-objects

```
mutation {
    add<object type>(input: {
        <fields>
    }) {
        <fields to return>
    }
}
```

Example:
```
mutation {
    addUser(input: {
        userId: "abc123"
        name: "Homer"
        age: 30
        gender: "male"
        lastLogin: "3/10/2019"
    }) {
        userId
    }
}
```

### Deletion
https://docs.realm.io/sync/graphql-web-access/graphiql-explorer#deleting-an-object

#### Delete an object with a given primary key

```
mutation {
    delete<object type>(<primary key>: <primary key value>)
}
```

Example:
```
mutation {
    deleteUser(userId: "abc123")
}
```

#### Delete all objects of type

```
mutation {
    delete<object type>s
}
```

Example:
```
mutation {
    deleteUsers
}
```

### Updates
https://docs.realm.io/sync/graphql-web-access/graphiql-explorer#updating-objects

### Update an object by primary key
```
mutation {
    update<object type>(input: {
        <primary key>: <primary key value>
        ...<field name>: <new value>
    }) {
        <fields to return>
    }
}
```

Example (updates make and color)
```
mutation {
    updateUser(input: {
        userId: "abc123"
        lastLogin: "3/11/2019"
    }) {
        userId
    }
}
```

### Subscribing for updates
https://docs.realm.io/sync/graphql-web-access/graphiql-explorer#subscribing

We can subscribe to a query and Realm will alert us whenever the result set changes--be that an addition, deletion or mutation.
Under the hood, the GraphQL client opens a WebSocket to the Realm server.

```
subscription {
    <query>
}
```

Example (tells us whenever the set of red vehicles in the databases changes in any way):
*Note: the actual implementation in our client app will let you specify a function to be called in response to a subscription update*
```
subscription {
    users(query: "gender = 'female'") {
        name
        age
        gender
        lastLogin
    }
}
```