/// <reference types="cypress" />

import { WebSocket, Server } from 'mock-socket';

import { createTransport } from './transport';

const SERVER_URL = 'ws://server.url';

describe('Подключение', () => {
    let server: Server | undefined;

    beforeEach(() => {
        cy.stub(window, 'WebSocket').callsFake((url) => {
            return new WebSocket(url);
        });
    });

    afterEach(() => {
        server?.close();
    });

    it('Подключение и отключение к серверу', () => {
        server = new Server(SERVER_URL);

        const transport = createTransport();

        const onClose = cy.stub();
        transport.on('close', onClose);
        const onError = cy.stub();
        transport.on('error', onError);
        const onOpen = cy.stub();
        transport.on('open', onOpen);

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.then(() => {
            transport.open(SERVER_URL);
        })
            .wait(100)
            .then(() => {
                expect(onClose).not.to.be.called;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .then(() => {
                transport.close();
            })
            .wait(100)
            .then(() => {
                expect(onClose).to.be.calledOnce;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            });
    });

    it('Сервер отключен, три попытки подключения, одна ошибка', () => {
        const transport = createTransport();

        const onClose = cy.stub();
        transport.on('close', onClose);
        const onError = cy.stub();
        transport.on('error', onError);
        const onOpen = cy.stub();
        transport.on('open', onOpen);

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.then(() => {
            transport.open(SERVER_URL);
        })
            .wait(1000)
            .then(() => {
                expect(onClose).to.be.calledThrice;
                expect(onError).to.be.calledOnce;
                expect(onOpen).not.to.be.called;
            });
    });

    it('Отключение сервера, три попытки переподключения, одна ошибка', () => {
        server = new Server(SERVER_URL);

        const transport = createTransport();

        const onOpen = cy.stub();
        transport.on('open', onOpen);
        const onError = cy.stub();
        transport.on('error', onError);
        const onClose = cy.stub();
        transport.on('close', onClose);

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.then(() => {
            transport.open(SERVER_URL);
        })
            .wait(100)
            .then(() => {
                expect(onClose).not.to.be.called;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .then(() => {
                server?.close();
            })
            .then(() => {
                expect(onClose).to.be.calledOnce;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .wait(1000)
            .then(() => {
                expect(onClose).to.be.callCount(4);
                expect(onError).to.be.calledOnce;
                expect(onOpen).to.be.calledOnce;
            });
    });

    it('Перезапуск сервера, переподключение с третьей попытки, нет ошибок', () => {
        server = new Server(SERVER_URL);

        const transport = createTransport();

        const onOpen = cy.stub();
        transport.on('open', onOpen);
        const onError = cy.stub();
        transport.on('error', onError);
        const onClose = cy.stub();
        transport.on('close', onClose);

        // eslint-disable-next-line cypress/no-unnecessary-waiting
        cy.then(() => {
            transport.open(SERVER_URL);
        })
            .wait(100)
            .then(() => {
                expect(onClose).not.to.be.called;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .then(() => {
                server?.close();
            })
            .then(() => {
                expect(onClose).to.be.calledOnce;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .wait(900)
            .then(() => {
                expect(onClose).to.be.calledThrice;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledOnce;
            })
            .then(() => {
                server = new Server(SERVER_URL);
            })
            .wait(100)
            .then(() => {
                expect(onClose).to.be.calledThrice;
                expect(onError).not.to.be.called;
                expect(onOpen).to.be.calledTwice;
            });
    });
});
