require("dotenv").config();
const exec = require("child_process").exec;
const path = require("path");
const {
  BlobServiceClient,
  StorageSharedKeyCredential,
} = require("@azure/storage-blob");

const backupDirPath = path.join(__dirname, "database-backup");

const storeFileOnAzure = async (file) => {
  const account = process.env.ACCOUNT_NAME;
  const accountKey = process.env.ACCOUNT_KEY;
  const containerName = "dbsnapshots";

  const sharedKeyCredential = new StorageSharedKeyCredential(
    account,
    accountKey
  );

  // instantiate Client
  const blobServiceClient = new BlobServiceClient(
    `https://${account}.blob.core.windows.net`,
    sharedKeyCredential
  );

  const container = blobServiceClient.getContainerClient(containerName);
  const blobName = "companies.bson";
  const blockBlobClient = container.getBlockBlobClient(blobName);
  const uploadBlobResponse = await blockBlobClient.uploadFile(file);
  console.log(
    `Upload block blob ${blobName} successfully`,
    uploadBlobResponse.requestId
  );
};

let cmd = `mongodump --forceTableScan --out=${backupDirPath} --uri=${process.env.MONGODB_URI}`;

const dbAutoBackUp = () => {
  let filePath = backupDirPath + `/db-back-up-schedule/companies.bson`;
  exec(cmd, (error, stdout, stderr) => {
    console.log([cmd, error, backupDirPath]);
    storeFileOnAzure(filePath);
  });
};

dbAutoBackUp();