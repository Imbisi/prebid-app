# Header Bidding System

## Overview
This project implements a **Header Bidding System** using **Prebid.js** to optimize ad revenue by integrating multiple demand partners.

## Features
- **Prebid.js Integration** with at least two SSPs.
- **Responsive Ad Units** for mobile and desktop.
- **Bid Adapter Integration** for header bidding.
- **Dynamic Floor Pricing** based on ad size and device type.
- **Analytics Tracking** for bid performance and latency.
- **Error Handling & Logging** for failed or invalid bids.
- **Fallback Ads** when no bids are received.
- **Bid Validation** using OpenRTB standards.
- **Lazy Loading** to improve performance.

## Setup & Installation

### Prerequisites
Ensure you have the following installed:
- **Node.js (v18 or later)**
- **npm (Node Package Manager)**

### Clone the Repository
```sh
git clone https://github.com/imbisi/prebid-app.git
cd prebid-app
```

### Install Dependencies
```sh
npm install
```

## Running the Project Locally
To start the development server:
```sh
npm start
```
This runs the app in development mode. Open `http://localhost:3000/prebid-app` in a browser to view it.

## Building the Project
To generate an optimized production build:
```sh
npm run build
```
This creates a `build/` folder with the static files.

## Deployment
The project is deployed using **GitHub Pages**. To deploy manually:
```sh
npm run deploy
```
This will:
1. Run `npm run build` to generate the latest production files.
2. Publish the `build/` directory to GitHub Pages.

### GitHub Actions (CI/CD)
The project is configured with a GitHub Actions workflow (`.github/workflows/main.yml`) to automatically build and deploy the app on every push to the `main` branch.

## Repository Structure
```
prebid-app/
│-- .github/workflows/ # GitHub Actions workflow
│-- public/          # Static assets
│-- src/             # Source code
│   ├── config/      # Prebid.js configuration
│   ├── style/       # Styling files
│   ├── App.js       # Main React App component
│   ├── index.js     # Entry point
│-- package.json     # Dependencies & scripts
│-- .gitignore       # Ingored files and directories on git
│-- README.md        # Project documentation
```

## Contributing
Contributions are welcome! To contribute:
1. Fork the repository.
2. Create a new feature branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m "Add new feature"`).
4. Push to your branch (`git push origin feature-branch`).
5. Open a Pull Request for review.

## License
This project is licensed under the **MIT License**.

## Author
Developed by **Imbisi**. Feel free to reach out for any questions or improvements at **imbisigeoffrey@gmail.com**

