import Service from './service';
import ServiceContainer from './service-container';

/**
 * Server service class.
 * 
 * This service allows to start and stop the server (API).
 */
export default class ServerService extends Service {

    /**
     * Creates a new server service.
     * 
     * @param container Services container
     */
    public constructor(container: ServiceContainer) {
        super(container);
    }

    /**
     * Starts the server.
     * 
     * @async
     */
    public async start(): Promise<void> {
        const { PORT, DB_HOST, DB_PORT, DB_NAME, WEBSOCKET_PORT } = process.env;

        // Starting server
        await this.container.express.start(PORT as unknown as number);
        this.container.log.info('Express started');

        // Connecting to database
        await this.container.db.connect(DB_HOST, DB_PORT, DB_NAME);
        this.container.log.info(`Connected to database ${DB_HOST}:${DB_PORT}/${DB_NAME}`);

        // Starting websocket server
        if (WEBSOCKET_PORT as unknown as number >= 0) {
        this.container.websocket.start(WEBSOCKET_PORT as unknown as number);
        this.container.log.info(`Websocket server listening on port ${WEBSOCKET_PORT}`);
      }
    }

    /**
     * Stops the server.
     * 
     * @async
     */
    public async stop(): Promise<void> {
        // Stopping all tasks
        this.container.scheduler.stopAllTasks();

        // Stopping server
        await this.container.express.stop();
        this.container.log.info('Server stopped');

        // Disconnecting from database
        await this.container.db.disconnect();
        this.container.log.info('Disconnected from database');
    }
}
