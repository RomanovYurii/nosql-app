FROM node

WORKDIR /usr/app

COPY package.json ./
COPY yarn.lock ./

# The following line was used by me to bypass local connection restrictions
#RUN yarn config set "strict-ssl" false
RUN yarn

COPY . .

EXPOSE 3000

CMD ["yarn", "start"]
