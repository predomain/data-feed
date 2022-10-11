import { MongoClient } from "mongodb";
import { MongoMemoryServer } from "mongodb-memory-server";
import {
  BehaviorSubject,
  catchError,
  map,
  Observable,
  of,
  switchMap,
} from "rxjs";
import { generalConfigurations } from "src/configurations";
import { DBErrorsEnum } from "src/models/db";
import { LogErrorTypesEnum } from "src/models/log";
import { LogService } from "../log";

export class SQLService {
  db: MongoMemoryServer;
  client: MongoClient;
  isDBReady = false;
  isDBReady$ = new BehaviorSubject<boolean>(false);

  constructor(protected logService: LogService) {
    this.initialise()
      .pipe(
        switchMap((r) => {
          if (r === false) {
            throw DBErrorsEnum.INIT_FAILED;
          }
          return this.connect(r as MongoClient);
        }),
        map((r) => {
          if (r === false) {
            throw DBErrorsEnum.CONNECT_FAILED;
          }
          this.isDBReady = true;
          this.isDBReady$.next(true);
          this.isDBReady$.complete();
          this.logService.print("SQL database initialised...");
        }),
        catchError((e) => {
          this.logService.error(
            LogErrorTypesEnum.CORE,
            "Unable to initialise SQL Server"
          );
          return of(false);
        })
      )
      .subscribe();
  }

  initialise() {
    return new Observable((observer) => {
      MongoMemoryServer.create({
        instance: {
          dbName: generalConfigurations.localDBName,
          dbPath: generalConfigurations.localDBPath,
          storageEngine: "wiredTiger",
        },
      }).then((db) => {
        this.db = db;
        const uri = this.db.getUri();
        this.client = new MongoClient(uri);
        observer.next(this.client);
        observer.complete();
      });
    });
  }

  connect(client: MongoClient) {
    return new Observable((observer) => {
      client
        .connect()
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  insert(collection: string, payload: any) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .insertOne(payload)
        .then((r) => {
          observer.next(payload.id);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  insertMany(collection: string, payload: any[]) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .insertMany(payload)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  update(collection: string, filter: object, payload: object, upsert = false) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .updateOne(filter, payload, { upsert })
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  updateMany(
    collection: string,
    filter: object,
    payload: object,
    upsert = false
  ) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .updateMany(filter, payload, { upsert })
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  delete(collection: string, payload: object) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .deleteOne(payload)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  deleteMany(collection: string, payload: object) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .deleteMany(payload)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  findAll(collection: string) {
    const dbCollection = this.client.db().collection(collection);
    return of(dbCollection.find());
  }

  find(collection: string, payload: object) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      dbCollection
        .findOne(payload)
        .then((r) => {
          observer.next(r);
          observer.complete();
        })
        .catch((e) => {
          observer.next(false);
          observer.complete();
        });
    });
  }

  findMany(collection: string, payload: object) {
    const dbCollection = this.client.db().collection(collection);
    return new Observable((observer) => {
      const findResult = dbCollection.find(payload).map((f) => f);
      observer.next(findResult);
      observer.complete();
    });
  }
}
