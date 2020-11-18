# Time Logger API Server

This is an API server for a time management system. A React client for it can be found in the sibling `client` directory.

Stack: MongoDB, Node.JS, Typescript, JSON over REST, Jest

## Features

- Authentication as user, manager, and admin using JWT
- Task definition at a day resolution
- Date range queries of time logs and export as HTML

## Data Model

- User
    - `id`
    - `created_at`
    - `updated_at`
    - `email`
    - `auth_info`
        - `salt`
        - `hash`
    - `role`
    - `settings`
        - `preferredDailyHours`
- Timelog
    - `id`
    - `created_at`
    - `updated_at`
    - `user_id`
    - `description`
    - `date`
    - `minutes`

## REST API

Unless specified all endpoints must be called with a bearer token in the Authorization header. A token may also be passed in the query string.

Dates are represented in DDMMMYYYY format, e.g. `03Apr2020`.

General API structure:

- /
    - GET {} => ok
- /api/v1
    - /auth
        - /login (unauthenticated)
            - POST { email, password } => { token }
        - /logout
            - POST {} => {}
        - /register (unauthenticated)
            - PUT { email, password } => { token }
    - /users
        - GET {} => [{ ...user }]
        - /user
            - GET {} => { ...user }
            - PUT { email, role } => { ...user }
            - /:id
                - GET {} => { ...user }
                - POST { email?, role?, settings? } => { ...user }
                - DELETE {} => { success }
    - /timelogs
        - GET { fromDate?, toDate? } => [{ ...timelog }]
        - .html
            - GET { fromDate?, toDate? } => html export
        - /timelog
            - PUT { description, date, minutes } => { ...timelog }
            - /:id
                - GET {} => { ...timelog }
                - POST { description?, date?, minutes? } => { ...timelog }
                - DELETE {} => { success }

## Setup and Running

1. Copy `.env.example` to `.env` and edit as needed
1. `npm install`
1. `npm run seed` to create three users (admin, manager, and user)
1. `npm run dev`

## Testing

- `npm run test` to run Jest tests
