-How to install

npm run install && npm run server

yarn && yarn server

-How to bring it live
#sudo apt update
#sudo apt install curl
#sudo apt install -y nodejs
#sudo apt install npm
#sudo apt install nginx
#sudo systemctl status nginx
#sudo ufw allow 'Nginx Full'
#sudo systemctl start nginx
#sudo systemctl enable nginx

#nginx configuration:

    ##go to /etc/nginx/sites-available and open your_domain.conf file, and put these:

        server {
            listen 80;
            server_name your_domain.com;

            location / {
                proxy_pass http://localhost:3000; # Assuming your Node.js app is running on port 3000
                proxy_http_version 1.1;
                proxy_set_header Upgrade $http_upgrade;
                proxy_set_header Connection 'upgrade';
                proxy_set_header Host $host;
                proxy_cache_bypass $http_upgrade;
            }
        }

    ##sudo ln -s /etc/nginx/sites-available/your_domain.conf /etc/nginx/sites-enabled/
    ##sudo nginx -t
    ##sudo systemctl reload nginx

#pm2 start dist/api.js

