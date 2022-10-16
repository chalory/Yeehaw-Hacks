using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class Shooting : MonoBehaviour{
    public Transform firePoint;
    public GameObject bulletPrefab;

    public float bulletForce = 3.5f;

    // Update is called once per frame
    void Update(){
        if (Input.GetMouseButtonDown(0)) {
            Shoot();
        }
    }

    void Shoot(){
        GameObject bullet = Instantiate(bulletPrefab, firePoint.position, firePoint.rotation);
        Rigidbody2D rb = bullet.GetComponent<Rigidbody2D>();
        Debug.Log(firePoint.position);
        rb.AddForce(firePoint.position * bulletForce, ForceMode2D.Impulse);
    }
}
