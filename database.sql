CREATE TABLE countries (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  capital VARCHAR(255),
  region VARCHAR(255),
  population BIGINT NOT NULL,
  currency_code VARCHAR(10),
  exchange_rate DECIMAL(20, 10),
  estimated_gdp DECIMAL(30, 10),
  flag_url VARCHAR(255),
  last_refreshed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE app_status (
  id INT PRIMARY KEY,
  last_refreshed_at TIMESTAMP
);

INSERT INTO app_status (id, last_refreshed_at) VALUES (1, NULL);
