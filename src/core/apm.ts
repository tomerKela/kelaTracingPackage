import { AgentConfigOptions, currentTransaction, start, startTransaction, TransactionOptions } from 'elastic-apm-node';
import { TransactionTypes } from '../types';

export class APMCore {
    private static instance: APMCore;
    private serviceName: string = 'did-not-set-service-name';
    private isAPMStarted: boolean = false;

    private constructor() {}

    static getInstance(): APMCore {
        if (!APMCore.instance) {
            APMCore.instance = new APMCore();
        }
        return APMCore.instance;
    }

    public startAPM(options: AgentConfigOptions): boolean {
        try {
            this.serviceName = options.serviceName || this.serviceName;
            const agent = start({
                ...options,
                serviceName: this.serviceName,
                secretToken: options.secretToken || '',
                serverUrl: options.serverUrl || 'http://logstash.ke-la.private:8200',
                environment: options.environment || 'did-not-set-environment'
            });

            if (!agent.isStarted()) {
                throw new Error('Agent failed to start');
            }

            console.log('APM agent is started!');
            this.isAPMStarted = true;
            return true;
        } catch (error) {
            console.error('Failed to initialize APM agent', error);
            return false;
        }
    }

    public startTransaction(type: TransactionTypes, traceID?: string): void {
        if (!this.isAPMStarted) {
            console.error('APM is not started');
            return;
        }
        const options: TransactionOptions = traceID ? { childOf: traceID } : {};
        startTransaction(this.serviceName, type, options);
    }

    public getTraceId(): string | undefined {
        if (!this.isAPMStarted) {
            console.error('APM is not started');
            return undefined;
        }
        const traceId = currentTransaction?.ids['trace.id'];
        if (!traceId) {
            console.log('No transaction found for outbound request');
        }
        return traceId;
    }

    public isStarted(): boolean {
        return this.isAPMStarted;
    }

    public getCurrentTransaction() {
        return currentTransaction;
    }
}

