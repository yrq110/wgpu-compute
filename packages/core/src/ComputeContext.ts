import { TextureHelper } from './data/TextureHelper';
import { BufferManager } from './data/BufferManager';
import { Observable } from './event/observable';

export interface ComputeEngineOptions {
    adapterOption?: GPURequestAdapterOptions;
    deviceDescriptor?: GPUDeviceDescriptor;
}

export class ComputeContext {
    public device: GPUDevice;

    public commandEncoder: GPUCommandEncoder;

    private _options: ComputeEngineOptions;

    private _adapter: GPUAdapter;

    private _commandBuffers: GPUCommandBuffer[];

    private _contextWasLost: boolean = false;

    public bufferManager: BufferManager;

    public textureHelper: TextureHelper;

    private _maxWarningCount = 200;

    private _warningCount = 0;

    public onBeforeSubmitObservers: Observable<undefined> = new Observable<undefined>();
    public onAfterSubmitObservers: Observable<undefined> = new Observable<undefined>();;

    public constructor(options: ComputeEngineOptions = {}) {
        this._options = options;
        this._options.adapterOption = this._options.adapterOption ?? {};
        this._options.deviceDescriptor = this._options.deviceDescriptor ?? {};
    }

    public static async CreateAsync(options: ComputeEngineOptions = {}): Promise<ComputeContext> {
        const engine = new ComputeContext(options);
        await engine.initAsync();
        return engine;
    }

    public async initAsync(): Promise<void> {
        try {
            if (!navigator.gpu) {
                console.error("WebGPU is not supported. Enable chrome://flags/#enable-unsafe-webgpu flag.");
                return;
            }

            // Adapter
            const adapter = await navigator.gpu.requestAdapter(this._options.adapterOption);
            if (!adapter) {
                console.error("Failed to get GPU adapter.");
                return;
            }
            this._adapter = adapter;

            // Device
            this.device = await adapter.requestDevice(this._options.deviceDescriptor);
            this.device.addEventListener('uncapturederror', (event) => {
                if (this._warningCount > this._maxWarningCount) return;
                this._warningCount += 1
                console.warn(`WebGPU uncaptured error: ${(<GPUUncapturedErrorEvent>event).error} - ${(<any>event).error.message}`);
            });

            this.device.lost?.then((info) => {
                this._contextWasLost = true;
                console.warn("WebGPU context lost. " + info);
            });

            // Other
            this.commandEncoder = this.device.createCommandEncoder({ label: "default" })
            this.bufferManager = new BufferManager(this.device);
            this.textureHelper = new TextureHelper(this.device, this.bufferManager);
        } catch (err) {
            console.error("Can not create WebGPU Device and/or context.");
            console.error(err);
            console.trace && console.trace();
        }
    }

    public submit() {
        this.onBeforeSubmitObservers.notify(undefined);
        this.bufferManager.destroyDeferredBuffers();

        const commandBuffers = [this.commandEncoder.finish()];
        this.device.queue.submit(commandBuffers);
        this.onAfterSubmitObservers.notify(undefined);

        this.commandEncoder = this.device.createCommandEncoder({ label: "default" });
    }
}