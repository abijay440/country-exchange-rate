# Country Currency & Exchange API

A RESTful API that fetches country data from an external API, stores it in a database, and provides CRUD operations.

## Features

- **Fetch and Refresh Data:** `POST /countries/refresh` - Fetches country and exchange rate data, computes GDP, and caches it in the database.
- **Get All Countries:** `GET /countries` - Retrieves all countries from the database with support for filtering and sorting.
- **Get Single Country:** `GET /countries/:name` - Retrieves a single country by its name.
- **Delete Country:** `DELETE /countries/:name` - Deletes a country from the database.
- **Get Status:** `GET /status` - Shows the total number of countries and the last refresh timestamp.
- **Get Summary Image:** `GET /countries/image` - Serves a generated image summarizing the data.

## Technologies Used

- **Node.js** for server-side JavaScript runtime
- **Express** for routing and middleware
- **TypeScript** for type safety
- **MySQL** for persistence
- **Axios** for API calls
- **Sharp** for Image generation
- **Dotenv** for environment variables


## Setup Instructions

1.  **Clone the repository:**

    ```bash
    git clone https://github.com/abijay440/country-exchange-rate.git
    cd country-exchange-rate
    ```

2.  **Install dependencies:**

    ```bash
    npm install
    ```

3.  **Set up the database:**

    - This project is configured to use a cloud-based MySQL database (e.g., from Aiven).
    - You will need to obtain the following from your database provider:
      - Host
      - Port
      - Username
      - Password
      - Database Name
      - CA Certificate

4.  **Configure environment variables:**

    - Create a `.env` file in the root of the project.
    - Add the following variables with the credentials from your database provider:

      ```
      DB_HOST=your-database-host
      DB_PORT=your-database-port
      DB_USER=your-database-username
      DB_PASSWORD=your-database-password
      DB_NAME=your-database-name
      DB_SSL_CA=ca.pem 
      PORT=3000
      ```

    - Save the CA certificate provided by your database provider into a file named `ca.pem` in the root of the project. For deployment purposes, you should enter all these in the secrets.

5. **Setup the database tables with the schema data:**

    - Make sure mysql is installed.
    - Run the following command to create the necessary tables:

    ```bash
    mysql --host=your-database-host --port=your-database-port --user=your-username -password=your-password --database=your-database-name < database.sql
    ```

  6. **Run test to confirm all is properly set**
     ```bash
    npm test
    ```


## API Usage

1.  **Run the application:**

    ```bash
    npm run dev
    ```

2.  **API Endpoints:**

    - **Refresh Data:**

      ```bash
      curl -X POST http://localhost:3000/countries/refresh
      ```

    - **Get All Countries:**

      ```bash
      curl http://localhost:3000/countries
      ```

    - **Filter by Region:**

      ```bash
      curl http://localhost:3000/countries?region=Africa
      ```

    - **Sort by GDP:**

      ```bash
      curl http://localhost:3000/countries?sort=gdp_desc
      ```

    - **Get a Single Country:**

      ```bash
      curl http://localhost:3000/countries/Nigeria
      ```

    - **Delete a Country:**

      ```bash
      curl -X DELETE http://localhost:3000/countries/Nigeria
      ```

    - **Get Status:**

      ```bash
      curl http://localhost:3000/status
      ```

    - **Get Summary Image:**

      ```bash
    
      ```

---

## 🧑‍💻 Author
Abiodun Jegede  
Full-Stack Developer @ Abisofts Inc
Email: abijay440@gmail.com  
profile: https://abijay440.github.io/cv/

---