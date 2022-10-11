import { ens_normalize } from "@adraffy/ens-normalize";
import { ethers } from "ethers";
import { request, gql } from "graphql-request";
import { from, of } from "rxjs";
import { generalConfigurations } from "src/configurations";

export class EnsService {
  constructor() {}

  getSubdomains(id: string) {
    const url = generalConfigurations.ensGraphAPI;
    try {
      const query = gql`
        query ($domainId: String!) {
          domain(id: $domainId) {
            id
            createdAt
            labelhash
            labelName
            subdomainCount
            subdomains {
              id
              labelName
              labelhash
            }
          }
        }
      `;
      return from(
        request(url, query, {
          domainId: ethers.BigNumber.from(id).toHexString(),
        })
      );
    } catch (e) {
      return of(false);
    }
  }

  getDomain(domain: string) {
    const url = generalConfigurations.ensGraphAPI;
    try {
      const query = gql`
        query ($domainId: String!) {
          registrations(first: 1, where: { id: $domainId }) {
            id
            labelName
            expiryDate
            registrationDate
            registrant {
              id
            }
            domain {
              id
              createdAt
              labelhash
              subdomainCount
              subdomains {
                id
                labelName
                labelhash
              }
            }
          }
        }
      `;
      return from(
        request(url, query, {
          domainId: ethers.BigNumber.from(domain).toHexString(),
        })
      );
    } catch (e) {
      return of(false);
    }
  }

  getNameLength(name: string) {
    let count;
    try {
      count = [...ens_normalize(name)].length;
    } catch (e) {
      count = name.length;
    }
    return count;
  }
}
