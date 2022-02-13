const mergeFiles = require('merge-files');
import * as fs from 'fs-extra';
import request from 'request';
import logger from 'electron-log';
const log = logger.create('downloader');
log.variables.label = 'downloader';
log.transports.console.format = '{h}:{i}:{s} > [{label}] {text}';
log.transports.file.format = '{h}:{i}:{s} > [{label}] {text}';

export interface IProgress {
    percent: number,
    total_size: number,
    received_size: number,
    status: string,
    from: 'downloader' | 'extract' | 'copy',
}

export class Downloader {
    downloading = false;
    path = '';
    threads = -1;
    paused = false;
    status = 'idle';
    on_thread = 0;
    progress: IProgress = {
        percent: -1,
        total_size: -1,
        received_size: -1,
        status: this.status,
        from: 'downloader',
    }

    public clearThreadFiles(path: string, threads: number) {
        for (let i = 0; i < threads; i++) {
            if (fs.pathExistsSync(path + `\\downloadingthread${i}.thread`)) {
                fs.unlinkSync(path + `\\downloadingthread${i}.thread`)
            };
        }
    }

    public cancel() {
        return new Promise((resolve, reject) => {
            this.status = 'cancel';

            if (this.progress_interval != undefined) {
                clearInterval(this.progress_interval);
                this.progress_interval = undefined;
            }
    
            for (let req of this.requests) {
                req.abort();
            }

            if (this.requests.length > 1) {
                this.clearThreadFiles(this.path, this.threads);
            }
    
            if (fs.pathExistsSync(`${this.path}\\modpack.zip`)) fs.unlinkSync(`${this.path}\\modpack.zip`);

            this.downloading = false;
            this.paused = false;
            this.path = '';
            this.threads = -1;
            this.status = 'idle';
            this.progress = {
                percent: -1,
                total_size: -1,
                received_size: -1,
                status: this.status,
                from: 'downloader',
            }
            this.requests = [];
            resolve(true);
        }).catch(err => {
            log.error(err)
        });
    }

    public pause() {
        this.paused = true;
        log.info('download paused')
        for (let req of this.requests) {
            req.pause();
        }
    }

    public resume() {
        this.paused = false;
        log.info('download resumed')
        for (let req of this.requests) {
            req.resume();
        }
    }

    //@ts-expect-error
    public async getInfo(url: string): {total_bytes: number} {
        let actual_attempts = 0; 
        this.progress = {
            percent: 0,
            received_size: 0,
            total_size: -1,
            status: this.status,
            from: 'downloader',
        }
        while (actual_attempts < 20) {
            actual_attempts++;;
            let attempts = 0; 
            while (attempts <= 5) {
                attempts++;
                let res: {total_bytes: number} = await new Promise((resolve, reject) => {
                    log.info(`attempting to get file size. [${attempts}]`);
                    
                    let req = request({
                        method: "GET",
                        url: url,
                    })
            
                    req.on('response', (data) => {
                        req.abort();
                        if (data.headers['content-length']) {
                            let total_bytes = data.headers['content-length'];
                            //@ts-expect-error
                            resolve({total_bytes});
                        }
                        //@ts-expect-error
                        resolve(null);
                    })
                })
                if (res != null) {
                    log.info(`file size: ${res.total_bytes}`);
                    return res;
                } else {
                    continue;
                }
            }

            await this.foolGithubIntoThinkingIAmAGoodPerson(url);
        }

        //@ts-expect-error
        return null;
    }

    private foolGithubIntoThinkingIAmAGoodPerson(url: string) {
        return new Promise((resolve, reject) => {
            log.info(`Faking download from: ${url}`);
    
            let req = request({
                method: "GET",
                uri: url,
            });
    
            let fooling = setTimeout(() => {
                req.abort();
                resolve('');
            }, 3000);
        });
    }
 
    requests: any[] = [];
    public async createDownloadThread(start_bytes: number, finish_bytes: number, url: string, path: string, thread_num: number, onData: Function, onEnd: Function) {
        let thread_created_successfully = false;
        let thread_attempts = 0;
        while (!thread_created_successfully) {
            thread_attempts++;
            log.info(`[DOWNLOAD THREAD] <${thread_num}> attempting to create thread from: ${start_bytes} to: ${finish_bytes}. [${thread_attempts}]`);

            if (thread_attempts > 7) {
                thread_attempts = 0;
                await this.foolGithubIntoThinkingIAmAGoodPerson(url);
            }

            let received_bytes = 0;
            let total_bytes = 0;

            await new Promise(async (resolve, reject) => {
                let req = request({
                    headers: {
                        Range: `bytes=${start_bytes}-${finish_bytes}`,
                    },
                    method: "GET",
                    url: url,
                })

                await fs.ensureFile(path + "\\" + `downloadingthread${thread_num}.thread`);
                let out = fs.createWriteStream(path + "\\" + `downloadingthread${thread_num}.thread`);
                req.pipe(out);
        
                let lazythreadtimeout: NodeJS.Timeout | undefined = undefined;
                req.on('response', (data) => {
                    //@ts-expect-error
                    total_bytes = parseInt(data.headers["content-length"]);
                    log.info(`[DOWNLOAD THREAD] <${thread_num}> Got response. Size: ${data.headers["content-length"]}`);
                    if (total_bytes != undefined && total_bytes > (finish_bytes - start_bytes) / 2) {
                        setTimeout(() => {
                            if (received_bytes > 0) {
                                log.info(`[DOWNLOAD THREAD] <${thread_num}> Thread creation successfull. `);
                                this.requests.push(req);
                                thread_created_successfully = true;

                                if (received_bytes == total_bytes) {
                                    onEnd();
                                }

                                resolve('success');
                            } else {
                                log.info(`[DOWNLOAD THREAD] <${thread_num}> Thread is not responding... retrying... `);
                                reject("broken thread");
                                req.abort();
                                out.end();
                            }
                        }, 1000);
                    } else {
                        log.info(`[DOWNLOAD THREAD] <${thread_num}> Empty response... retrying... `);
                        reject("broken thread");
                        req.abort();
                        out.end();
                    }
                })

                req.on("data", function (chunk) {
                    // Update the received bytes
                    received_bytes += chunk.length;
                    onData(chunk.length);
                    if (chunk.length == 0) {
                        if (lazythreadtimeout == undefined) {
                            lazythreadtimeout = setTimeout(() => {
                                log.info(`[DOWNLOAD THREAD] <${thread_num}> Thread seems unresponsive...`);
                            }, 5000)
                        }
                    } else {
                        if (lazythreadtimeout)
                            clearTimeout(lazythreadtimeout);
                    }
                });

                req.on("end", function (data) {
                    req.abort();
                    if (thread_created_successfully)
                        onEnd();
                });

            }).then((res) => {
                return 'test';
            })
            .catch((err) => {
                fs.unlinkSync(path + "\\" + `downloadingthread${thread_num}.thread`);
                log.info(`[DOWNLOAD THREAD] <${thread_num}> broken thread`);
            });
        }
    }

    progress_interval: NodeJS.Timeout | undefined = undefined;
    public download(folder: string, url: string, file_name: string, threads: number = 1, onProgress: (progress: any) => void): Promise<string> {
        return new Promise(async (resolve, reject) => {
            if (this.downloading) {
                log.info(`download in progress.`)
                reject();
            }
            this.on_thread = 0;
            this.downloading = true;
            this.path = folder;
            this.threads = threads;
            log.info(`initiating threaded download with '${threads}' threads from '${url}' to ${folder}`)
            this.status = 'awaiting';

            let file_info = await this.getInfo(url);
    
            if (file_info == null) {
                log.info(`something went wrong while getting size... aborting download`);
                resolve('');
            }
    
            let received_bytes = 0;
            let total_bytes = file_info.total_bytes;
            let threads_done = 0;

            this.progress_interval = setInterval(() => {
                if (this.paused) return;
                this.progress = {
                    percent: received_bytes / total_bytes,
                    received_size: received_bytes,
                    total_size: total_bytes,
                    status: this.status,
                    from: 'downloader',
                }
                onProgress(this.progress);
            }, 1000)
    
            for (let i = 0; i < threads; i++) {
                let chunk_start = Math.floor((total_bytes / threads) * i);
                if (i > 0) chunk_start++;
                let chunk_finish = Math.floor((total_bytes / threads) * (i + 1));
    
                await this.createDownloadThread(chunk_start, chunk_finish, url, folder, i, 
                    (chunk_length: any) => { // onprogress
                        received_bytes += chunk_length;
                    }, async () => { // onend
                        log.info(`[DOWNLOAD THREAD] <${i}> thread done`);
                        threads_done++;
                        this.on_thread = threads_done + 1;
                        
                        if (threads_done == threads) {
                            if (this.downloading) {
                                log.info(`merging threads...`);
                            
                                if (this.progress_interval != undefined) {
                                    clearInterval(this.progress_interval);
                                    this.progress_interval = undefined;
                                }

                                this.status = 'merging';
                                this.progress = {
                                    percent: 1,
                                    received_size: total_bytes,
                                    total_size: total_bytes,
                                    status: this.status,
                                    from: 'downloader',
                                }
                                onProgress(this.progress);
                            
                                const outputPath = folder + `\\${file_name}`;
                            
                                let inputPathList = [];
                            
                                //. Add Thread to Threads list
                                for (let i = 0; i < threads; i++) {
                                    inputPathList.push(folder + `\\downloadingthread${i}.thread`);
                                }
                            
                                const status = await mergeFiles(inputPathList, outputPath);
                                log.info(`files merged: ${status}`);
                            
                                this.status = 'idle';
                                this.progress = {
                                    percent: 1,
                                    received_size: total_bytes,
                                    total_size: total_bytes,
                                    status: this.status,
                                    from: 'downloader',
                                }
                                onProgress(this.progress);
                            
                                this.clearThreadFiles(folder, threads);
                                log.info(`completed`);
                                this.downloading = false;
                                resolve(outputPath);
                            } else {
                                log.info(`canceled`);
                                resolve('');
                            }
                        }
                    }
                )

                await new Promise((_resolve, reject) => { setTimeout(() => {_resolve(null)}, 500) } );
            }

            this.status = 'download';
        })
    }
}